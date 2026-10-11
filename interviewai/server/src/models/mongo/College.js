const mongoose = require('mongoose')

const collegeSchema = new mongoose.Schema({
  collegeId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  domain: { type: String, trim: true },
  logo: { type: String },
  adminUserId: { type: String },
  departments: [{ type: String }],
  batches: [{ type: String }],
  stats: {
    totalStudents: { type: Number, default: 0 },
    activeDrives: { type: Number, default: 0 },
    avgPlacementScore: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

collegeSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('College', collegeSchema)
