const mongoose = require('mongoose')

const batchSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, index: true },
  departmentCode: { type: String, required: true, uppercase: true },
  year: { type: String, required: true }, // e.g. '2026'
  section: { type: String, default: 'A' },
  facultyAdvisorId: { type: String },
  facultyAdvisorName: { type: String },
  studentCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

batchSchema.index({ institutionId: 1, departmentCode: 1, year: 1, section: 1 }, { unique: true })

module.exports = mongoose.model('Batch', batchSchema)
