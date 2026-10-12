const express = require('express')
const {
  bulkImportStudents,
  verifyStudentProfile,
  createDrive,
  listDrives,
  getEligibleDrivesForStudent,
  applyForDrive,
  updateApplicationStage,
  getApplicationsForKanban,
  getCohortAnalytics,
  createFacultyAssignment,
  listFacultyAssignments,
  testAtsMatch
} = require('./campusController')
const { authenticateToken, permit, requireRole } = require('../../middleware/auth')
const { auditAction } = require('../audit/auditMiddleware')

const router = express.Router()

// 1. Bulk Onboarding & Roster (Placement Officer / Faculty)
router.post('/onboard/csv', authenticateToken, permit('roster:import'), bulkImportStudents)

// 2. Profile Verification (Faculty / Placement Officer)
router.patch('/students/:id/verify', authenticateToken, permit('student:verify'), verifyStudentProfile)

// 3. Drive Management
router.post('/drives', authenticateToken, permit('drive:create'), createDrive)
router.get('/drives', authenticateToken, listDrives)

// 4. Student Eligibility & Application
router.get('/drives/eligible', authenticateToken, getEligibleDrivesForStudent)
router.post('/drives/:id/apply', authenticateToken, permit('drive:apply'), applyForDrive)

// 5. Kanban Round Tracking (Placement Officer & Recruiters)
router.get('/applications', authenticateToken, getApplicationsForKanban)
router.patch('/applications/:id/stage', authenticateToken, permit('application:stage_update'), updateApplicationStage)

// 6. Institutional & Officer Analytics
router.get('/analytics/cohort', authenticateToken, permit('analytics:read'), getCohortAnalytics)

// 7. Faculty Assignments
router.post('/assignments', authenticateToken, permit('assignment:create'), createFacultyAssignment)
router.get('/assignments', authenticateToken, listFacultyAssignments)

// 8. ATS & JD Matching Endpoint
router.post('/ats/match', authenticateToken, testAtsMatch)

module.exports = router
