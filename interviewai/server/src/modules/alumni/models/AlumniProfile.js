const mongoose = require('mongoose')

const alumniProfileSchema = new mongoose.Schema({
  institutionId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  rollNumber: { type: String, trim: true, uppercase: true },
  company: { type: String, required: true, trim: true }, // e.g. 'Google', 'Microsoft', 'Amazon'
  role: { type: String, required: true, trim: true }, // e.g. 'Senior SDE', 'Product Manager'
  graduationYear: { type: String, required: true }, // e.g. '2023'
  department: { type: String, uppercase: true, default: 'CSE' },
  domain: { type: String, default: 'Software Engineering' }, // e.g. 'Backend Systems', 'AI/ML'
  expertiseTags: [{ type: String }], // e.g. ['Distributed Systems', 'Kubernetes', 'System Design']
  bio: { type: String },
  linkedinUrl: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationMethod: {
    type: String,
    enum: ['institutional_email', 'roll_match', 'officer_approval', 'manual'],
    default: 'officer_approval'
  },
  verifiedBy: { type: String },
  verifiedAt: { type: Date },
  rating: { type: Number, default: 5.0 },
  totalSessionsHelped: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

alumniProfileSchema.index({ institutionId: 1, company: 1 })
alumniProfileSchema.index({ institutionId: 1, domain: 1 })
alumniProfileSchema.index({ institutionId: 1, graduationYear: 1 })

module.exports = mongoose.model('AlumniProfile', alumniProfileSchema)
