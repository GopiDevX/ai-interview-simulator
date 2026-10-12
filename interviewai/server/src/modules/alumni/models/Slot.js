const mongoose = require('mongoose')

const slotSchema = new mongoose.Schema({
  alumniProfileId: { type: String, required: true, index: true },
  alumniUserId: { type: String, required: true },
  alumniName: { type: String, required: true },
  institutionId: { type: String, required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  topic: { type: String, default: 'Mock Technical Interview & System Design Review' },
  isBooked: { type: Boolean, default: false },
  bookedByStudentId: { type: String },
  bookedByStudentName: { type: String },
  roomId: { type: String },
  status: {
    type: String,
    enum: ['available', 'booked', 'completed', 'cancelled'],
    default: 'available'
  },
  createdAt: { type: Date, default: Date.now }
})

slotSchema.index({ institutionId: 1, startTime: 1 })

module.exports = mongoose.model('Slot', slotSchema)
