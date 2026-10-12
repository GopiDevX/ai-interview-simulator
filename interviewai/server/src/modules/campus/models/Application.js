const mongoose = require('mongoose')

const stageHistorySchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['Applied', 'Aptitude', 'Technical', 'HR', 'Offer', 'Rejected'],
    required: true
  },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String }, // Placement officer or faculty ID
  feedback: { type: String }
})

const applicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true, index: true },
  driveId: { type: String, required: true, index: true },
  institutionId: { type: String, required: true, index: true },
  studentProfileId: { type: String, required: true, index: true },
  studentUserId: { type: String },
  studentName: { type: String, required: true },
  studentRoll: { type: String, required: true },
  department: { type: String },
  currentStage: {
    type: String,
    enum: ['Applied', 'Aptitude', 'Technical', 'HR', 'Offer', 'Rejected'],
    default: 'Applied',
    index: true
  },
  stageHistory: [stageHistorySchema],
  resumeMatchScore: { type: Number, default: 0 }, // 0 to 100 calculated from RAG ATS matcher
  missingSkills: [{ type: String }],
  matchExplanation: { type: String },
  readinessScoreSnapshot: { type: Number, default: 0 },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

applicationSchema.index({ driveId: 1, studentProfileId: 1 }, { unique: true })
applicationSchema.index({ institutionId: 1, currentStage: 1 })

applicationSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('Application', applicationSchema)
