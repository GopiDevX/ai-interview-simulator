const mongoose = require('mongoose')

const alumniScorecardSchema = new mongoose.Schema({
  mentorshipRequestId: { type: String, index: true },
  sessionId: { type: String, index: true },
  institutionId: { type: String, required: true, index: true },
  alumniProfileId: { type: String, required: true },
  alumniName: { type: String, required: true },
  alumniCompany: { type: String },
  studentProfileId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  studentRoll: { type: String },
  roleEvaluated: { type: String, default: 'Software Engineering' },
  rubric: {
    communication: { type: Number, required: true, min: 1, max: 10 },
    depth: { type: Number, required: true, min: 1, max: 10 }, // Technical depth & correctness
    problemSolving: { type: Number, required: true, min: 1, max: 10 },
    overallScore: { type: Number, required: true, min: 1, max: 10 }
  },
  derivedQualityLabel: {
    type: String,
    enum: ['weak', 'average', 'good', 'excellent'],
    required: true
  },
  hireRecommendation: {
    type: String,
    enum: ['strong_hire', 'hire', 'lean_hire', 'no_hire'],
    default: 'hire'
  },
  strengths: [{ type: String }],
  areasOfImprovement: [{ type: String }],
  writtenFeedback: { type: String, required: true },
  candidateResponseSnippet: { type: String },
  exportedForMlRetraining: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

alumniScorecardSchema.pre('validate', function(next) {
  if (!this.derivedQualityLabel && this.rubric?.overallScore) {
    const s = this.rubric.overallScore
    if (s >= 8.5) this.derivedQualityLabel = 'excellent'
    else if (s >= 7.0) this.derivedQualityLabel = 'good'
    else if (s >= 5.0) this.derivedQualityLabel = 'average'
    else this.derivedQualityLabel = 'weak'
  }
  next()
})

module.exports = mongoose.model('AlumniScorecard', alumniScorecardSchema)
