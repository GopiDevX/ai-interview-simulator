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
  generateReportHandler,
  getMlMetricsHandler,
  executeCodeHandler
} = require('../controllers/interviewController')

const { getAvailableCompanies, getCompanyProfile } = require('../services/companyKnowledgeBase')

const router = express.Router()

// Get trained ML model evaluation metrics (public, great for project demo & reviews)
router.get('/ml-metrics', getMlMetricsHandler)

// Get available companies with curated datasets (public)
router.get('/companies', (req, res) => {
  const companies = getAvailableCompanies()
  const profiles = companies.map(name => {
    const profile = getCompanyProfile(name)
    return {
      name: profile.name,
      industry: profile.industry,
      difficulty: profile.typicalDifficulty,
      rounds: profile.rounds.length,
      questionsCount: profile.commonQuestions.length,
      focusAreas: profile.focusAreas.slice(0, 3)
    }
  })
  res.json({ companies: profiles, total: profiles.length })
})

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

// Execute code in sandbox runner
router.post('/execute-code', authenticateToken, executeCodeHandler)

// End the session
router.post('/:sessionId/end', authenticateToken, validate(sessionIdParam), endInterview)

// Update session stage
router.put('/:sessionId/stage', authenticateToken, validate(updateStageSchema), updateStage)

// Generate report
router.post('/:sessionId/reports', authenticateToken, validate(sessionIdParam), generateReportHandler)

module.exports = router
