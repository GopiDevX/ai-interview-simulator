const User = require('../models/mongo/User')
const Session = require('../models/mongo/Session')

// GET /api/admin/candidates
const getAllCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: { $in: ['candidate', 'student'] } }).select('-passwordHash')
    
    // Fetch aggregated session stats for each candidate
    const candidateStats = await Promise.all(candidates.map(async (candidate) => {
      const sessions = await Session.find({ userId: candidate._id })
      const completed = sessions.filter(s => s.status === 'completed')
      
      let avgScore = 0
      if (completed.length > 0) {
        const totalScore = completed.reduce((acc, curr) => {
          return acc + (curr.codeScore || 0)
        }, 0)
        avgScore = Math.round(totalScore / completed.length)
      }

      return {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        role: candidate.role,
        institutionId: candidate.collegeId || candidate.institutionId,
        tier: candidate.tier,
        completedInterviews: candidate.completedInterviews,
        totalSessions: sessions.length,
        avgScore
      }
    }))

    res.json(candidateStats)
  } catch (err) {
    console.error('Admin candidates error:', err)
    res.status(500).json({ error: 'Failed to fetch candidates' })
  }
}

// GET /api/admin/candidates/:userId/sessions
const getCandidateSessions = async (req, res) => {
  try {
    const { userId } = req.params
    const sessions = await Session.find({ userId })
      .select('sessionId role company status startedAt completedAt codeScore')
      .sort({ startedAt: -1 })
    res.json(sessions)
  } catch (err) {
    console.error('Admin sessions error:', err)
    res.status(500).json({ error: 'Failed to fetch candidate sessions' })
  }
}

module.exports = { getAllCandidates, getCandidateSessions }
