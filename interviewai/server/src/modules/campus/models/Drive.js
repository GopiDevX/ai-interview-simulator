const mongoose = require('mongoose')

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  name: { type: String, required: true }, // e.g. 'Aptitude Screening', 'Technical Round 1', 'HR Round'
  type: {
    type: String,
    enum: ['aptitude', 'technical', 'coding', 'hr', 'managerial'],
    default: 'technical'
  },
  instructions: { type: String },
  date: { type: Date }
})

const driveSchema = new mongoose.Schema({
  driveId: { type: String, required: true, unique: true, index: true },
  institutionId: { type: String, required: true, index: true },
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  salaryPackage: { type: String }, // e.g. '12 LPA'
  location: { type: String },
  jdText: { type: String, required: true },
  requiredSkills: [{ type: String }],
  eligibilityRules: {
    minCgpa: { type: Number, default: 6.0 },
    maxBacklogs: { type: Number, default: 0 },
    allowedBranches: [{ type: String }], // e.g. ['CSE', 'IT', 'ECE']
    batchYear: { type: String, default: '2026' }
  },
  rounds: [roundSchema],
  dates: {
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    driveDate: { type: Date }
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'archived'],
    default: 'active'
  },
  totalEligible: { type: Number, default: 0 },
  totalApplied: { type: Number, default: 0 },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

driveSchema.index({ institutionId: 1, status: 1 })

module.exports = mongoose.model('Drive', driveSchema)
