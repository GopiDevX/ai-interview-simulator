const express = require('express')
const {
  queryInstitutionalRag,
  generateLearningPath,
  adaptiveTurn,
  analyzeDeliveryMetrics,
  sanitizeGuardrails,
  explainScore,
  getFairnessReport,
  rankCandidatesForRecruiter,
  deleteMyData
} = require('./advancedAiController')
const { authenticateToken, permit } = require('../../middleware/auth')

const router = express.Router()

// 1. Institutional RAG with Citations
router.post('/rag/query', authenticateToken, queryInstitutionalRag)

// 2. Personalized Learning Path
router.post('/learning-path', authenticateToken, generateLearningPath)

// 3. Adaptive Interview Engine (Elo & Multi-Agent)
router.post('/adaptive/step', authenticateToken, adaptiveTurn)

// 4. Delivery Metrics (Voice & MediaPipe proxy)
router.post('/delivery/analyze', authenticateToken, analyzeDeliveryMetrics)

// 5. Security Guardrails (Prompt Injection + PII Redaction)
router.post('/guardrails/sanitize', authenticateToken, sanitizeGuardrails)

// 6. Explainable Scoring & Confidence Intervals
router.post('/scoring/explain', authenticateToken, explainScore)

// 7. Demographic Fairness Audit
router.get('/scoring/fairness', authenticateToken, permit('analytics:read'), getFairnessReport)

// 8. Recruiter Candidate Ranking against JD
router.post('/recruiter/rank', authenticateToken, permit('candidate:search'), rankCandidatesForRecruiter)

// 9. DPDP Act Right to Erasure
router.delete('/privacy/my-data', authenticateToken, permit('data:delete_own'), deleteMyData)

module.exports = router
