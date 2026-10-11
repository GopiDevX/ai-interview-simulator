const mongoose = require('mongoose')

const placementDriveSchema = new mongoose.Schema({
  driveId: { type: String, required: true, unique: true },
  collegeId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  targetDepartments: [{ type: String }],
  targetBatch: { type: String, default: '2026' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'archived'],
    default: 'active'
  },
  proctoringLevel: {
    type: String,
    enum: ['standard', 'strict'],
    default: 'strict'
  },
  rounds: [{
    roundNumber: Number,
    name: String,
    type: { type: String, enum: ['ai_technical', 'coding', 'hr_avatar'] }
  }],
  totalRegistered: { type: Number, default: 0 },
  totalCompleted: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

placementDriveSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('PlacementDrive', placementDriveSchema)
