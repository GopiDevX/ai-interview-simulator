const express = require('express')
const { getAllCandidates, getCandidateSessions } = require('../controllers/adminController')
const { authenticateToken, permit, requireRole } = require('../middleware/auth')

const router = express.Router()

// Admin routes (require token and proper administrative or placement permissions)
router.get('/candidates', authenticateToken, requireRole('admin', 'placement_officer', 'recruiter'), getAllCandidates)
router.get('/candidates/:userId/sessions', authenticateToken, requireRole('admin', 'placement_officer', 'recruiter'), getCandidateSessions)

module.exports = router
