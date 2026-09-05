const express = require('express')
const { getAllCandidates, getCandidateSessions, promoteToRecruiter } = require('../controllers/adminController')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Admin routes (require both token and recruiter role)
router.get('/candidates', authenticateToken, requireAdmin, getAllCandidates)
router.get('/candidates/:userId/sessions', authenticateToken, requireAdmin, getCandidateSessions)

// Hidden route for testing (only requires token)
router.post('/promote', authenticateToken, promoteToRecruiter)

module.exports = router
