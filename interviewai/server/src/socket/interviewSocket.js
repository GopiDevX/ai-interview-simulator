const geminiAiService = require('../services/geminiAiService')
const mockAiService = require('../services/mockAiService')
const ragService = require('../services/ragService')
const matchmakingService = require('../services/matchmakingService')
const Session = require('../models/mongo/Session')
const DocumentEmbedding = require('../models/mongo/DocumentEmbedding')

const setupInterviewSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    // ----------------------------------------
    // AI INTERVIEW LOGIC (Gemini + RAG Streaming)
    // ----------------------------------------
    socket.on('join-session', ({ sessionId }) => {
      socket.join(sessionId)
      console.log(`[Socket] ${socket.id} joined AI interview session: ${sessionId}`)
    })

    socket.on('send-message', async ({ sessionId, content, stage, questionIndex, resumeText }) => {
      try {
        io.to(sessionId).emit('ai-typing', { isTyping: true })

        // 1. Fetch Session and question plan
        let session = null
        try {
          session = await Session.findOne({ sessionId })
        } catch { /* graceful fallback */ }

        const currentStage = stage || session?.stage || 'intro'
        const currentQIndex = questionIndex !== undefined ? questionIndex : 0
        const questionPlan = session?.questionPlan || mockAiService.generateQuestionPlan('Full Stack Developer', 'Google')
        
        // 2. RAG Context Retrieval: Query persistent vector store
        let retrievedResumeContext = resumeText || session?.resumeText || ''
        try {
          const currentQuestion = questionPlan?.backgroundQuestions?.[currentQIndex]?.question ||
            questionPlan?.technicalQuestions?.[currentQIndex]?.question ||
            questionPlan?.behavioralQuestions?.[currentQIndex]?.question || ''
          
          const queryText = `${currentStage} interview question: ${currentQuestion} Candidate said: ${content}`
          
          // Query persistent MongoDB vectors first
          const relevantChunks = await DocumentEmbedding.similaritySearch({
            sessionId,
            queryText,
            topK: 3
          })

          if (relevantChunks && relevantChunks.length > 0) {
            retrievedResumeContext = ragService.formatChunksForPrompt(relevantChunks)
            console.log(`[Socket RAG] Injected ${relevantChunks.length} persistent vectors for session ${sessionId}`)
          }
        } catch (ragErr) {
          console.warn('[Socket RAG] Vector lookup fallback:', ragErr.message)
        }

        // 3. Call Gemini AI Service with full RAG context and company knowledge
        const companyContext = session?.companyContext || ''
        let responseText = ''

        try {
          responseText = await geminiAiService.getInterviewerResponse(
            currentStage,
            currentQIndex,
            questionPlan,
            content,
            retrievedResumeContext,
            companyContext
          )
        } catch (aiErr) {
          console.warn('[Socket Gemini] AI generation fallback:', aiErr.message)
          responseText = await mockAiService.getInterviewerResponse(
            currentStage,
            currentQIndex,
            questionPlan,
            content,
            retrievedResumeContext
          )
        }

        // 4. Stream response tokens smoothly over Socket.IO
        const words = responseText.split(' ')
        const chunkSize = 3
        let fullText = ''

        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '')
          fullText += chunk
          io.to(sessionId).emit('ai-message-chunk', { text: chunk })
          // Natural speech pacing jitter (35-65ms)
          await new Promise(resolve => setTimeout(resolve, 35 + Math.random() * 30))
        }

        io.to(sessionId).emit('ai-typing', { isTyping: false })

        const shouldMoveToCoding = responseText.toLowerCase().includes('coding exercise') ||
          responseText.toLowerCase().includes('coding round')

        io.to(sessionId).emit('ai-message-done', {
          fullText: fullText.trim(),
          shouldMoveToCoding
        })

        if (shouldMoveToCoding) {
          io.to(sessionId).emit('session-stage-change', { stage: 'coding' })
        }

        // 5. Persist transcript turn
        if (session) {
          const candidateMsg = { role: 'candidate', content, timestamp: new Date() }
          const interviewerMsg = { role: 'interviewer', content: fullText.trim(), timestamp: new Date() }
          session.transcript.push(candidateMsg, interviewerMsg)
          if (shouldMoveToCoding) session.stage = 'coding'
          await session.save().catch(() => null)
        }

      } catch (err) {
        console.error('[Socket] Message handler error:', err)
        io.to(sessionId).emit('ai-typing', { isTyping: false })
        socket.emit('error', { message: 'Failed to process interview response' })
      }
    })

    // ----------------------------------------
    // DISTRIBUTED MATCHMAKING & WEBRTC SIGNALING
    // ----------------------------------------
    socket.on('find-partner', async ({ userId, name }) => {
      console.log(`[Matchmaking] User ${name} (${socket.id}) searching for partner...`)
      
      const { match, waiting } = await matchmakingService.findOrEnqueue({
        socketId: socket.id,
        userId,
        name
      })

      if (match) {
        const roomId = `p2p_${Math.random().toString(36).substring(2, 9)}`
        socket.join(roomId)
        io.sockets.sockets.get(match.socketId)?.join(roomId)

        io.to(roomId).emit('partner-found', { roomId, partnerName: match.name })
        io.to(match.socketId).emit('initiate-offer')
        console.log(`[Matchmaking] Matched ${socket.id} with ${match.socketId} in room ${roomId}`)
      }
    })

    socket.on('cancel-find-partner', async () => {
      await matchmakingService.removeUser(socket.id)
    })

    // WebRTC Signaling Channels
    socket.on('webrtc-offer', ({ offer, roomId }) => {
      socket.to(roomId).emit('webrtc-offer', { offer })
    })

    socket.on('webrtc-answer', ({ answer, roomId }) => {
      socket.to(roomId).emit('webrtc-answer', { answer })
    })

    socket.on('webrtc-ice-candidate', ({ candidate, roomId }) => {
      socket.to(roomId).emit('webrtc-ice-candidate', { candidate })
    })

    // Collaborative Code Editor Sync
    socket.on('code-update', ({ code, roomId }) => {
      socket.to(roomId).emit('code-update', { code })
    })

    socket.on('leave-session', ({ sessionId }) => {
      socket.leave(sessionId)
    })

    socket.on('disconnect', async () => {
      await matchmakingService.removeUser(socket.id)
      console.log(`[Socket] Disconnected: ${socket.id}`)
    })
  })
}

module.exports = { setupInterviewSocket }
