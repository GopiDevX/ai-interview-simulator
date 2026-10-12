const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema({
  studentProfileId: { type: String, required: true },
  studentRoll: { type: String, required: true },
  studentName: { type: String, required: true },
  sessionId: { type: String },
  overallScore: { type: Number, default: 0 },
  technicalScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  codeScore: { type: Number, default: 0 },
  facultyOverrideScore: { type: Number },
  facultyNotes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'flagged'],
    default: 'submitted'
  }
})

const assignmentSchema = new mongoose.Schema({
  assignmentId: { type: String, required: true, unique: true, index: true },
  institutionId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  targetDepartment: { type: String, required: true }, // e.g. 'CSE'
  targetBatchYear: { type: String, required: true, default: '2026' },
  targetSection: { type: String, default: 'All' },
  role: { type: String, default: 'Full Stack Developer' },
  company: { type: String, default: 'Google' },
  deadline: { type: Date, required: true },
  createdByFacultyId: { type: String, required: true },
  createdByName: { type: String },
  submissions: [submissionSchema],
  totalAssigned: { type: Number, default: 0 },
  totalSubmitted: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

assignmentSchema.index({ institutionId: 1, targetDepartment: 1, targetBatchYear: 1 })

module.exports = mongoose.model('Assignment', assignmentSchema)
