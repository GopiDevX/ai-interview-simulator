const mongoose = require('mongoose')

const driveSubmissionSchema = new mongoose.Schema({
  driveId: { type: String, required: true },
  sessionId: { type: String },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed'],
    default: 'assigned'
  },
  overallScore: { type: Number, default: 0 },
  technicalScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  problemSolvingScore: { type: Number, default: 0 },
  codeScore: { type: Number, default: 0 },
  integrityScore: { type: Number, default: 100 },
  readinessTier: {
    type: String,
    enum: ['Tier 1 Ready', 'Tier 2 Ready', 'Needs Training', 'Pending'],
    default: 'Pending'
  },
  flaggedIssues: [{ type: String }],
  completedAt: { type: Date }
})

const studentRosterSchema = new mongoose.Schema({
  collegeId: { type: String, required: true, index: true },
  userId: { type: String }, // Links to User._id if student signs in
  rollNumber: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  department: { type: String, required: true, trim: true },
  batch: { type: String, default: '2026' },
  section: { type: String, default: 'A' },
  cgpa: { type: Number, default: 0 },
  phone: { type: String },
  status: {
    type: String,
    enum: ['enrolled', 'active', 'placed'],
    default: 'enrolled'
  },
  driveHistory: [driveSubmissionSchema],
  avgScore: { type: Number, default: 0 },
  totalMocksTaken: { type: Number, default: 0 },
  predictedTier: {
    type: String,
    enum: ['Tier 1 Ready', 'Tier 2 Ready', 'Needs Training', 'Unassessed'],
    default: 'Unassessed'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

studentRosterSchema.index({ collegeId: 1, rollNumber: 1 }, { unique: true })
studentRosterSchema.index({ collegeId: 1, email: 1 })

studentRosterSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('StudentRoster', studentRosterSchema)
