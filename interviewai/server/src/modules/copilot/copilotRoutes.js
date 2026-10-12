const express = require('express')
const copilotService = require('./copilotService')
const { authenticateToken } = require('../../middleware/auth')

const router = express.Router()

/**
 * POST /api/copilot/chat
 * Placement Copilot conversational tool-calling endpoint
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, confirmation } = req.body
    if (!message && !confirmation) {
      return res.status(400).json({ error: 'Message or confirmation required' })
    }

    const response = await copilotService.chatWithCopilot(message, req.user, confirmation)
    res.json(response)
  } catch (err) {
    console.error('[Copilot] Error:', err)
    res.status(500).json({ error: 'Copilot query failed' })
  }
})

module.exports = router
