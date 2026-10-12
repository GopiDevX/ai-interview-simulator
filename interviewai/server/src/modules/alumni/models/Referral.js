const mongoose = require('mongoose')

const applicantSchema = new mongoose.Schema({
  studentProfileId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentRoll: { type: String },
  studentEmail: { type: String },
  resumeUrl: { type: String },
  cgpa: { type: Number },
  appliedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['submitted', 'referred', 'interviewing', 'declined'],
    default: 'submitted'
  },
  alumniFeedback: { type: String }
})

const referralSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, index: true },
  alumniProfileId: { type: String, required: true, index: true },
  alumniName: { type: String, required: true },
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  jobLocation: { type: String, default: 'Bangalore / Remote' },
  externalJobUrl: { type: String },
  jobDescription: { type: String, required: true },
  requiredExperience: { type: String, default: 'Fresher / 0-2 Years' },
  requiredSkills: [{ type: String }],
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  applicants: [applicantSchema],
  createdAt: { type: Date, default: Date.now }
})

referralSchema.index({ institutionId: 1, company: 1 })

module.exports = mongoose.model('Referral', referralSchema)
