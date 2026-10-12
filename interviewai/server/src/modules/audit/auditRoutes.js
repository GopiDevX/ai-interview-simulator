const express = require('express')
const AuditLog = require('./AuditLog')
const { authenticateToken, permit } = require('../../middleware/auth')

const router = express.Router()

// GET /api/audit/logs - Retrieve audit logs for institution
router.get('/logs', authenticateToken, permit('audit:read'), async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const { action, limit = 50 } = req.query

    const filter = { institutionId }
    if (action) filter.action = action

    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(parseInt(limit))
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit logs' })
  }
})

module.exports = router
