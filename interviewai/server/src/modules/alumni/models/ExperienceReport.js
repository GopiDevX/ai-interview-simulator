const mongoose = require('mongoose')

const experienceRoundSchema = new mongoose.Schema({
  roundName: { type: String, required: true }, // e.g. 'Online Coding Assessment', 'System Design'
  roundType: { type: String, default: 'technical' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  questionsAsked: [{ type: String }],
  keyTakeaways: { type: String }
})

const experienceReportSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, index: true },
  alumniProfileId: { type: String, required: true },
  alumniName: { type: String, required: true },
  graduationYear: { type: String },
  company: { type: String, required: true, trim: true }, // Expands beyond hardcoded companies
  role: { type: String, required: true, trim: true },
  interviewYear: { type: String, default: '2025' },
  selectionStatus: {
    type: String,
    enum: ['offered', 'rejected', 'withdrawn'],
    default: 'offered'
  },
  overallDifficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  rounds: [experienceRoundSchema],
  preparationTips: { type: String },
  recommendedResources: [{ type: String }],
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  moderatedBy: { type: String },
  moderatedAt: { type: Date },
  indexedInRag: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

experienceReportSchema.index({ institutionId: 1, company: 1 })
experienceReportSchema.index({ moderationStatus: 1, indexedInRag: 1 })

module.exports = mongoose.model('ExperienceReport', experienceReportSchema)
