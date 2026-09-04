const { getInterviewerResponse } = require('../services/mockAiService')
const Session = require('../models/mongo/Session')

const setupInterviewSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.on('join-session', ({ sessionId }) => {
      socket.join(sessionId)
      console.log(`Socket ${socket.id} joined session ${sessionId}`)
    })

    socket.on('send-message', async ({ sessionId, content, stage, questionIndex }) => {
      try {
        // Emit typing indicator
        socket.to(sessionId).emit('ai-typing', { isTyping: true })
        io.to(sessionId).emit('ai-typing', { isTyping: true })

        // Get session for question plan
        let questionPlan = null
        try {
          const session = await Session.findOne({ sessionId })
          questionPlan = session?.questionPlan
        } catch { /* fallback */ }

        // Generate AI response
        const responseText = getInterviewerResponse(
          stage || 'intro',
          questionIndex || 0,
          questionPlan,
          content
        )

        // Simulate streaming: emit chunks with delay
        const words = responseText.split(' ')
        const chunkSize = 3
        let fullText = ''

        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize).join(' ') + ' '
          fullText += chunk

          io.to(sessionId).emit('ai-message-chunk', { text: chunk })

          // Simulate typing speed
          await new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 40))
        }

        // Stop typing indicator and emit done
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

        // Persist to MongoDB
        try {
          await Session.findOneAndUpdate(
            { sessionId },
            {
              $push: {
                transcript: {
                  $each: [
                    { role: 'candidate', content, timestamp: new Date() },
                    { role: 'interviewer', content: fullText.trim(), timestamp: new Date() }
                  ]
                }
              }
            }
          )
        } catch { /* MongoDB may not be available */ }

      } catch (err) {
        console.error('Socket message error:', err)
        socket.emit('error', { message: 'Failed to process message' })
      }
    })

    socket.on('leave-session', ({ sessionId }) => {
      socket.leave(sessionId)
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}

module.exports = { setupInterviewSocket }
