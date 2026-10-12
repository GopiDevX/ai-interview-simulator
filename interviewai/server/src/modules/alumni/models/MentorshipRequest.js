const mongoose = require('mongoose')

const mentorshipRequestSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, index: true },
  studentProfileId: { type: String, required: true, index: true },
  studentUserId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentRoll: { type: String },
  alumniProfileId: { type: String, required: true, index: true },
  alumniName: { type: String, required: true },
  company: { type: String },
  topic: { type: String, required: true },
  goalsText: { type: String, required: true },
  slotId: { type: String },
  scheduledAt: { type: Date },
  roomId: { type: String }, // Connects to WebRTC room
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'declined', 'cancelled'],
    default: 'pending'
  },
  alumniNotes: { type: String },
  scorecardSubmitted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

mentorshipRequestSchema.index({ studentProfileId: 1, alumniProfileId: 1 })

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema)
