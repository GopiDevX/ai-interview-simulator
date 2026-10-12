const institutionalRagService = require('./services/institutionalRagService')
const learningPathService = require('./services/learningPathService')
const adaptiveInterviewEngine = require('./services/adaptiveInterviewEngine')
const deliveryAnalysisService = require('./services/deliveryAnalysisService')
const guardrailsService = require('./services/guardrailsService')
const explainableScoringService = require('./services/explainableScoringService')
const StudentProfile = require('../campus/models/StudentProfile')
const AuditLog = require('../audit/AuditLog')

// 1. Institutional RAG with Citations
const queryInstitutionalRag = async (req, res) => {
  try {
    const { queryText, docType, topK } = req.body
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const citations = await institutionalRagService.searchWithCitations({
      institutionId,
      queryText,
      docType,
      topK: topK || 3
    })
    res.json({ query: queryText, results: citations })
  } catch (err) {
    res.status(500).json({ error: 'RAG search failed' })
  }
}

// 2. Personalized Learning Path
const generateLearningPath = async (req, res) => {
  try {
    const { targetRole, targetCompany, weakTopics, currentReadiness } = req.body
    const plan = learningPathService.generatePath({
      targetRole,
      targetCompany,
      weakTopics,
      currentReadiness
    })
    res.json(plan)
  } catch (err) {
    res.status(500).json({ error: 'Learning path generation failed' })
  }
}

// 3. Adaptive Interview State Machine & Elo
const adaptiveTurn = async (req, res) => {
  try {
    const { currentState, candidateAnswer, topic, currentElo } = req.body
    const result = adaptiveInterviewEngine.processTurn({
      currentState,
      candidateAnswer,
      topic,
      currentElo
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Adaptive engine evaluation failed' })
  }
}

// 4. Delivery Metrics (Voice & Client Camera Proxy)
const analyzeDeliveryMetrics = async (req, res) => {
  try {
    const { transcript, durationSeconds, clientCameraProxy } = req.body
    const metrics = deliveryAnalysisService.analyzeDelivery(
      transcript,
      durationSeconds,
      clientCameraProxy
    )
    res.json(metrics)
  } catch (err) {
    res.status(500).json({ error: 'Delivery analysis failed' })
  }
}

// 5. Guardrails (Prompt Injection + PII Redaction)
const sanitizeGuardrails = async (req, res) => {
  try {
    const { text } = req.body
    const injectionCheck = guardrailsService.sanitizeInput(text)
    const piiRedaction = guardrailsService.redactPii(injectionCheck.sanitizedText)

    res.json({
      cleanText: piiRedaction.redactedText,
      injectionDetected: injectionCheck.injectionDetected,
      neutralizedPatterns: injectionCheck.neutralizedPatterns,
      piiRedactionCount: piiRedaction.redactionCount
    })
  } catch (err) {
    res.status(500).json({ error: 'Guardrail check failed' })
  }
}

// 6. Explainable Scoring & Confidence Intervals
const explainScore = async (req, res) => {
  try {
    const { question, answer } = req.body
    const explanation = explainableScoringService.explainScore(question, answer)
    res.json(explanation)
  } catch (err) {
    res.status(500).json({ error: 'Score explanation failed' })
  }
}

// 7. Demographic Fairness Check
const getFairnessReport = async (req, res) => {
  try {
    const report = explainableScoringService.evaluateGroupFairness()
    res.json(report)
  } catch (err) {
    res.status(500).json({ error: 'Fairness audit failed' })
  }
}

// 8. Recruiter Candidate Ranking
const rankCandidatesForRecruiter = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const { jdText, requiredSkills = [] } = req.body

    const students = await StudentProfile.find({ institutionId }).lean()
    const ranked = await explainableScoringService.rankStudentsForRecruiter(
      students,
      jdText,
      requiredSkills
    )
    res.json({ totalCandidates: ranked.length, rankedCandidates: ranked })
  } catch (err) {
    res.status(500).json({ error: 'Recruiter ranking failed' })
  }
}

// 9. DPDP Act Right to Erasure (Delete My Data)
const deleteMyData = async (req, res) => {
  try {
    const userId = req.user.id
    const institutionId = req.user.institutionId

    // Remove student profile and transcripts
    await StudentProfile.deleteOne({ userId })

    await AuditLog.record({
      institutionId,
      actorId: userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'data:delete_own',
      targetType: 'privacy_dpdp',
      details: { statutoryAct: 'DPDP Act 2023 (Right to Erasure)' }
    })

    res.json({ message: 'All personal student records and transcripts have been permanently deleted in accordance with data privacy regulations.' })
  } catch (err) {
    res.status(500).json({ error: 'Data deletion failed' })
  }
}

module.exports = {
  queryInstitutionalRag,
  generateLearningPath,
  adaptiveTurn,
  analyzeDeliveryMetrics,
  sanitizeGuardrails,
  explainScore,
  getFairnessReport,
  rankCandidatesForRecruiter,
  deleteMyData
}
