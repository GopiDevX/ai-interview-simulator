const express = require('express')
const {
  onboardAlumni,
  verifyAlumniProfile,
  getAlumniDirectory,
  matchMentors,
  publishAvailabilitySlot,
  listAvailableSlots,
  bookSlot,
  submitScorecard,
  submitExperienceReport,
  moderateExperienceReport,
  listExperienceReports,
  postReferral,
  listReferrals,
  applyForReferral,
  getAlumniOutcomes
} = require('./alumniController')
const { authenticateToken, permit } = require('../../middleware/auth')

const router = express.Router()

// 1. Alumni Onboarding & Verification
router.post('/profile', authenticateToken, onboardAlumni)
router.patch('/:id/verify', authenticateToken, permit('alumni:verify'), verifyAlumniProfile)

// 2. Directory & Search
router.get('/directory', authenticateToken, getAlumniDirectory)

// 3. Mentor Matching
router.post('/match', authenticateToken, matchMentors)

// 4. Slots & Live Sessions
router.post('/slots', authenticateToken, permit('slot:publish'), publishAvailabilitySlot)
router.get('/slots', authenticateToken, listAvailableSlots)
router.post('/slots/:id/book', authenticateToken, permit('mentorship:request'), bookSlot)

// 5. Alumni Scorecard (Ground Truth ML data)
router.post('/scorecard', authenticateToken, permit('scorecard:submit'), submitScorecard)

// 6. Experience Repository & RAG Indexing
router.post('/experiences', authenticateToken, permit('experience:submit'), submitExperienceReport)
router.patch('/experiences/:id/moderate', authenticateToken, permit('experience:moderate'), moderateExperienceReport)
router.get('/experiences', authenticateToken, listExperienceReports)

// 7. Referral Board
router.post('/referrals', authenticateToken, permit('referral:post'), postReferral)
router.get('/referrals', authenticateToken, listReferrals)
router.post('/referrals/:id/apply', authenticateToken, applyForReferral)

// 8. Alumni Outcome Analytics
router.get('/analytics/outcomes', authenticateToken, getAlumniOutcomes)

module.exports = router
