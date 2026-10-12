const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: function() { return this.authProvider === 'local' } },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String },
  avatar: { type: String },
  tier: { type: String, enum: ['free', 'pro'], default: 'free' },
  completedInterviews: { type: Number, default: 0 },
  role: {
    type: String,
    enum: [
      'student',
      'faculty',
      'alumni',
      'placement_officer',
      'recruiter',
      'admin',
      // Legacy compatibility:
      'candidate',
      'tpo',
      'college_admin'
    ],
    default: 'student'
  },
  institutionId: { type: String, index: true },
  collegeId: { type: String }, // Legacy alias for institutionId
  department: { type: String },
  batchYear: { type: String },
  rollNumber: { type: String, trim: true },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  // DPDP Act & Privacy Compliance
  consentGiven: { type: Boolean, default: true },
  consentTimestamp: { type: Date, default: Date.now },
  dataRetentionUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

userSchema.pre('save', function (next) {
  if (this.collegeId && !this.institutionId) {
    this.institutionId = this.collegeId
  }
  if (this.institutionId && !this.collegeId) {
    this.collegeId = this.institutionId
  }
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('User', userSchema)
