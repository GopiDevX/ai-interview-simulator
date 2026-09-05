const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const { upload } = require('../middleware/upload')
const { validate } = require('../middleware/validate')
const {
  startInterviewSchema,
  sessionIdParam,
  sendMessageSchema,
  evaluateAnswerSchema,
  evaluateCodeSchema,
  updateStageSchema
} = require('../validations/interviewSchemas')

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

// Create a new interview session
router.post('/', authenticateToken, upload.single('resume'), validate(startInterviewSchema), startInterview)

// Get all sessions for the user
router.get('/', authenticateToken, getUserSessions)

// Get a specific session
router.get('/:sessionId', authenticateToken, validate(sessionIdParam), getSessionHandler)

// Add a message to the session transcript
router.post('/:sessionId/messages', authenticateToken, validate(sendMessageSchema), sendMessage)

// Evaluate an answer in the session
router.post('/:sessionId/evaluations/answer', authenticateToken, validate(evaluateAnswerSchema), evaluateAnswerHandler)

// Evaluate code in the session
router.post('/:sessionId/evaluations/code', authenticateToken, validate(evaluateCodeSchema), evaluateCodeHandler)

// End the session
router.post('/:sessionId/end', authenticateToken, validate(sessionIdParam), endInterview)

// Update session stage
router.put('/:sessionId/stage', authenticateToken, validate(updateStageSchema), updateStage)

// Generate report
router.post('/:sessionId/reports', authenticateToken, validate(sessionIdParam), generateReportHandler)

module.exports = router
