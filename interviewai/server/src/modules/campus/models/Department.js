const mongoose = require('mongoose')

const departmentSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true }, // e.g. CSE, IT, ECE
  headOfDepartment: { type: String },
  createdAt: { type: Date, default: Date.now }
})

departmentSchema.index({ institutionId: 1, code: 1 }, { unique: true })

module.exports = mongoose.model('Department', departmentSchema)
