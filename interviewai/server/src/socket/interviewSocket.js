const { getInterviewerResponse } = require('../services/mockAiService')
const Session = require('../models/mongo/Session')

const waitingUsers = []

const setupInterviewSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    // ----------------------------------------
    // AI INTERVIEW LOGIC
    // ----------------------------------------
    socket.on('join-session', ({ sessionId }) => {
      socket.join(sessionId)
      console.log(`Socket ${socket.id} joined AI session ${sessionId}`)
    })

    socket.on('send-message', async ({ sessionId, content, stage, questionIndex, resumeText }) => {
      try {
        socket.to(sessionId).emit('ai-typing', { isTyping: true })
        io.to(sessionId).emit('ai-typing', { isTyping: true })

        let questionPlan = null
        try {
          const session = await Session.findOne({ sessionId })
          questionPlan = session?.questionPlan
        } catch { /* fallback */ }

        // Note: we can't easily await the Gemini service here if it was refactored in the controller,
        // so we'll just use the mock logic here or let the controller handle AI. 
        // For the sake of the existing code, we'll keep the mock logic fallback.
        const responseText = getInterviewerResponse(
          stage || 'intro',
          questionIndex || 0,
          questionPlan,
          content
        )

        const words = responseText.split(' ')
        const chunkSize = 3
        let fullText = ''

        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize).join(' ') + ' '
          fullText += chunk
          io.to(sessionId).emit('ai-message-chunk', { text: chunk })
          await new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 40))
        }

        io.to(sessionId).emit('ai-typing', { isTyping: false })
        const shouldMoveToCoding = responseText.toLowerCase().includes('coding exercise') || responseText.toLowerCase().includes('coding round')
        
        io.to(sessionId).emit('ai-message-done', { fullText: fullText.trim(), shouldMoveToCoding })
        if (shouldMoveToCoding) io.to(sessionId).emit('session-stage-change', { stage: 'coding' })

      } catch (err) {
        socket.emit('error', { message: 'Failed to process message' })
      }
    })

    // ----------------------------------------
    // WEBRTC PEER-TO-PEER LOGIC
    // ----------------------------------------
    
    // Matchmaking
    socket.on('find-partner', ({ userId, name }) => {
      console.log(`User ${name} (${socket.id}) is looking for a partner.`)
      
      if (waitingUsers.length > 0) {
        const partner = waitingUsers.shift()
        
        // Prevent matching with self (edge case)
        if (partner.socketId === socket.id) {
          waitingUsers.push(partner)
          return
        }

        const roomId = `p2p_${Math.random().toString(36).substring(2, 9)}`
        
        socket.join(roomId)
        io.sockets.sockets.get(partner.socketId)?.join(roomId)

        // Notify both users they found a match
        io.to(roomId).emit('partner-found', { roomId })
        
        // Tell the first user to initiate the WebRTC offer
        io.to(partner.socketId).emit('initiate-offer')
        console.log(`Matched ${socket.id} with ${partner.socketId} in room ${roomId}`)
      } else {
        waitingUsers.push({ socketId: socket.id, userId, name })
      }
    })

    socket.on('cancel-find-partner', () => {
      const idx = waitingUsers.findIndex(u => u.socketId === socket.id)
      if (idx !== -1) waitingUsers.splice(idx, 1)
    })

    // WebRTC Signaling
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

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
      const idx = waitingUsers.findIndex(u => u.socketId === socket.id)
      if (idx !== -1) waitingUsers.splice(idx, 1)
    })
  })
}

module.exports = { setupInterviewSocket }
