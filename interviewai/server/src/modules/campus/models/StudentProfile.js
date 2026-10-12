const mongoose = require('mongoose')

const resumeVersionSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  parsedText: { type: String },
  uploadedAt: { type: Date, default: Date.now }
})

const studentProfileSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  rollNumber: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String },
  department: { type: String, required: true, uppercase: true }, // e.g. 'CSE'
  batchYear: { type: String, required: true, default: '2026' },
  section: { type: String, default: 'A' },
  cgpa: { type: Number, required: true, min: 0, max: 10, default: 0 },
  backlogs: { type: Number, default: 0 },
  skills: [{ type: String }],
  certifications: [{ type: String }],
  resumeVersions: [resumeVersionSchema],
  currentResumeUrl: { type: String },
  verifiedByFaculty: { type: Boolean, default: false },
  verifiedBy: { type: String }, // Faculty user ID
  verifiedAt: { type: Date },
  readinessScore: { type: Number, default: 0 }, // 0 to 100
  readinessBreakdown: {
    mockAvg: { type: Number, default: 0 },
    codeScore: { type: Number, default: 0 },
    resumeJDMatch: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 }
  },
  readinessTier: {
    type: String,
    enum: ['Tier 1 Ready', 'Tier 2 Ready', 'Needs Training', 'Unassessed'],
    default: 'Unassessed'
  },
  mockCount: { type: Number, default: 0 },
  codingProblemCount: { type: Number, default: 0 },
  placementStatus: {
    type: String,
    enum: ['seeking', 'placed', 'opted_out'],
    default: 'seeking'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

studentProfileSchema.index({ institutionId: 1, rollNumber: 1 }, { unique: true })
studentProfileSchema.index({ institutionId: 1, email: 1 })
studentProfileSchema.index({ institutionId: 1, department: 1, batchYear: 1 })

studentProfileSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('StudentProfile', studentProfileSchema)
