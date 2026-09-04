const Session = require('../models/mongo/Session')
const { generateQuestionPlan, evaluateAnswer, evaluateCode, getInterviewerResponse, generateReport } = require('../services/mockAiService')
const { v4: uuid } = require('uuid')

// In-memory store as fallback when MongoDB is unavailable
const inMemorySessions = new Map()

const getSession = async (sessionId) => {
  try {
    const session = await Session.findOne({ sessionId })
    return session
  } catch {
    return inMemorySessions.get(sessionId) || null
  }
}

const saveSession = async (data) => {
  try {
    const session = await Session.create(data)
    return session
  } catch {
    inMemorySessions.set(data.sessionId, { ...data, _id: data.sessionId })
    return data
  }
}

const updateSession = async (sessionId, update) => {
  try {
    return await Session.findOneAndUpdate({ sessionId }, update, { new: true })
  } catch {
    const session = inMemorySessions.get(sessionId) || {}
    const updated = { ...session, ...update.$set, ...update }
    inMemorySessions.set(sessionId, updated)
    return updated
  }
}

// POST /api/interview/start
const startInterview = async (req, res) => {
  try {
    const { role, company, interviewType, resumeText } = req.body
    const userId = req.user?.id || 'guest'
    const sessionId = uuid()

    if (!role || !company) {
      return res.status(400).json({ error: 'Role and company are required' })
    }

    const questionPlan = generateQuestionPlan(role, company)

    const sessionData = {
      sessionId,
      userId,
      role,
      company,
      interviewType: interviewType || 'full',
      resumeText: resumeText || '',
      resumeUrl: req.file ? `/uploads/${req.file.filename}` : null,
      questionPlan,
      transcript: [],
      stage: 'intro',
      status: 'active',
      startedAt: new Date()
    }

    await saveSession(sessionData)

    res.json({
      sessionId,
      questionPlan,
      message: 'Interview session started successfully'
    })
  } catch (err) {
    console.error('Start interview error:', err)
    res.status(500).json({ error: 'Failed to start interview' })
  }
}

// POST /api/interview/message — returns AI response (simulated streaming via chunks)
const sendMessage = async (req, res) => {
  try {
    const { sessionId, content, stage, questionIndex } = req.body
    const session = await getSession(sessionId)

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Save candidate message to transcript
    const candidateMsg = {
      role: 'candidate',
      content,
      timestamp: new Date(),
      score: null,
      feedback: null
    }

    // Get AI response
    const aiResponseText = getInterviewerResponse(
      stage || session.stage || 'intro',
      questionIndex || 0,
      session.questionPlan,
      content
    )

    const aiMsg = {
      role: 'interviewer',
      content: aiResponseText,
      timestamp: new Date(),
      score: null,
      feedback: null
    }

    await Session.findOneAndUpdate(
      { sessionId },
      { $push: { transcript: { $each: [candidateMsg, aiMsg] } } }
    ).catch(() => {
      const s = inMemorySessions.get(sessionId) || {}
      s.transcript = [...(s.transcript || []), candidateMsg, aiMsg]
      inMemorySessions.set(sessionId, s)
    })

    // Determine if we should move to coding round
    const shouldMoveToCoding = aiResponseText.toLowerCase().includes("coding exercise") ||
      aiResponseText.toLowerCase().includes("coding round")

    res.json({
      message: aiResponseText,
      shouldMoveToCoding,
      stage: shouldMoveToCoding ? 'coding' : (stage || session.stage)
    })
  } catch (err) {
    console.error('Message error:', err)
    res.status(500).json({ error: 'Failed to process message' })
  }
}

// POST /api/interview/evaluate-answer
const evaluateAnswerHandler = async (req, res) => {
  try {
    const { sessionId, question, answer } = req.body
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' })
    }

    const evaluation = evaluateAnswer(question, answer)

    // Update the last candidate message in transcript with scores
    await Session.findOneAndUpdate(
      { sessionId, 'transcript.role': 'candidate', 'transcript.score': null },
      { $set: { 'transcript.$.score': evaluation.score, 'transcript.$.feedback': evaluation.feedback } }
    ).catch(() => null)

    res.json(evaluation)
  } catch (err) {
    console.error('Evaluate error:', err)
    res.status(500).json({ error: 'Evaluation failed' })
  }
}

// POST /api/interview/evaluate-code
const evaluateCodeHandler = async (req, res) => {
  try {
    const { sessionId, question, code, language } = req.body
    if (!code) return res.status(400).json({ error: 'Code is required' })

    const evaluation = evaluateCode(question, code, language || 'javascript')

    await Session.findOneAndUpdate(
      { sessionId },
      { $set: { codeSubmission: code, codeScore: evaluation.score, codeEvaluation: evaluation } }
    ).catch(() => {
      const s = inMemorySessions.get(sessionId) || {}
      Object.assign(s, { codeSubmission: code, codeScore: evaluation.score, codeEvaluation: evaluation })
      inMemorySessions.set(sessionId, s)
    })

    res.json(evaluation)
  } catch (err) {
    console.error('Code evaluation error:', err)
    res.status(500).json({ error: 'Code evaluation failed' })
  }
}

// POST /api/interview/end
const endInterview = async (req, res) => {
  try {
    const { sessionId } = req.body
    await Session.findOneAndUpdate(
      { sessionId },
      { $set: { status: 'completed', completedAt: new Date() } }
    ).catch(() => {
      const s = inMemorySessions.get(sessionId) || {}
      s.status = 'completed'
      s.completedAt = new Date()
      inMemorySessions.set(sessionId, s)
    })
    res.json({ message: 'Interview ended', sessionId })
  } catch (err) {
    res.status(500).json({ error: 'Failed to end interview' })
  }
}

// POST /api/interview/stage
const updateStage = async (req, res) => {
  try {
    const { sessionId, stage } = req.body
    await Session.findOneAndUpdate({ sessionId }, { $set: { stage } }).catch(() => null)
    res.json({ success: true, stage })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stage' })
  }
}

// GET /api/interview/:sessionId
const getSessionHandler = async (req, res) => {
  try {
    const session = await getSession(req.params.sessionId)
    if (!session) return res.status(404).json({ error: 'Session not found' })
    res.json(session)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session' })
  }
}

// GET /api/interview/user/sessions
const getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id })
      .select('sessionId role company status startedAt completedAt stage')
      .sort({ startedAt: -1 })
      .limit(20)
    res.json(sessions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions', sessions: [] })
  }
}

// POST /api/interview/report/generate
const generateReportHandler = async (req, res) => {
  try {
    const { sessionId } = req.body
    const session = await getSession(sessionId)
    if (!session) return res.status(404).json({ error: 'Session not found' })

    const report = generateReport(session.transcript || [], {
      role: session.role,
      company: session.company,
      codeScore: session.codeScore
    })

    // Mark session as completed
    await Session.findOneAndUpdate(
      { sessionId },
      { $set: { status: 'completed', completedAt: new Date() } }
    ).catch(() => null)

    res.json({ ...report, sessionId, role: session.role, company: session.company })
  } catch (err) {
    console.error('Report generation error:', err)
    res.status(500).json({ error: 'Report generation failed' })
  }
}

module.exports = {
  startInterview,
  sendMessage,
  evaluateAnswerHandler,
  evaluateCodeHandler,
  endInterview,
  updateStage,
  getSessionHandler,
  getUserSessions,
  generateReportHandler
}
