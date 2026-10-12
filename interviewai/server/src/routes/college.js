const express = require('express')
const {
  getCollegeOverview,
  updateCollegeProfile,
  getStudents,
  uploadRoster,
  getSampleCsvTemplate,
  getDrives,
  createDrive,
  getDriveDetails,
  getCollegeAnalytics,
  exportRecruiterList,
  submitDriveMock,
  getStudentAssignedDrives
} = require('../controllers/collegeController')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Optional token validation for public/demo mode or student views
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return next()
  try {
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'interviewai_secret')
    req.user = decoded
  } catch (e) {
    // Ignore invalid token in optional mode
  }
  next()
}

// College Overview & Profile
router.get('/overview', optionalAuth, getCollegeOverview)
router.put('/profile', optionalAuth, updateCollegeProfile)

// Student Database & Roster
router.get('/students', optionalAuth, getStudents)
router.post('/students/upload', optionalAuth, uploadRoster)
router.get('/sample-csv', getSampleCsvTemplate)

// Mock Drives
router.get('/drives', optionalAuth, getDrives)
router.post('/drives', optionalAuth, createDrive)
router.get('/drives/:driveId', optionalAuth, getDriveDetails)

// Institutional Analytics
router.get('/analytics', optionalAuth, getCollegeAnalytics)

// Recruiter Export
router.get('/export-recruiter', optionalAuth, exportRecruiterList)

// Student Drive Actions
router.post('/submit-mock', optionalAuth, submitDriveMock)
router.get('/student-assigned-drives', optionalAuth, getStudentAssignedDrives)

module.exports = router
