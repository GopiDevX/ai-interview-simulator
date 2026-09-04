const express = require('express')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Placeholder report routes — report generation is handled in interview routes
router.get('/history', authenticateToken, async (req, res) => {
  res.json({ reports: [], message: 'No reports yet' })
})

module.exports = router
