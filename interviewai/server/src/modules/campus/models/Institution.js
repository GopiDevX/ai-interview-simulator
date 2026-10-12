const mongoose = require('mongoose')

const institutionSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  domain: { type: String, trim: true }, // e.g. 'campus.edu'
  address: { type: String },
  readinessWeights: {
    mockScore: { type: Number, default: 0.35 },
    codeScore: { type: Number, default: 0.30 },
    resumeJDMatch: { type: Number, default: 0.20 },
    consistency: { type: Number, default: 0.15 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Institution', institutionSchema)
