const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['interviewer', 'candidate'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  score: { type: Number, default: null },
  feedback: { type: String, default: null }
})

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  role: { type: String, required: true },
  company: { type: String, required: true },
  interviewType: { type: String, default: 'full' },
  resumeUrl: { type: String },
  resumeText: { type: String },
  questionPlan: { type: mongoose.Schema.Types.Mixed },
  transcript: [messageSchema],
  codingQuestion: { type: mongoose.Schema.Types.Mixed },
  codeSubmission: { type: String },
  codeScore: { type: Number },
  codeEvaluation: { type: mongoose.Schema.Types.Mixed },
  stage: {
    type: String,
    enum: ['intro', 'background', 'technical', 'behavioral', 'coding', 'done'],
    default: 'intro'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
})

module.exports = mongoose.model('Session', sessionSchema)
