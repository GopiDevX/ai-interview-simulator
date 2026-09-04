const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const { upload } = require('../middleware/upload')
const {
  startInterview,
  sendMessage,
  evaluateAnswerHandler,
  evaluateCodeHandler,
  endInterview,
  updateStage,
  getSessionHandler,
  getUserSessions,
  generateReportHandler
} = require('../controllers/interviewController')

const router = express.Router()

router.post('/start', authenticateToken, upload.single('resume'), startInterview)
router.post('/message', authenticateToken, sendMessage)
router.post('/evaluate-answer', authenticateToken, evaluateAnswerHandler)
router.post('/evaluate-code', authenticateToken, evaluateCodeHandler)
router.post('/end', authenticateToken, endInterview)
router.post('/stage', authenticateToken, updateStage)
router.post('/report/generate', authenticateToken, generateReportHandler)
router.get('/user/sessions', authenticateToken, getUserSessions)
router.get('/:sessionId', authenticateToken, getSessionHandler)

module.exports = router
