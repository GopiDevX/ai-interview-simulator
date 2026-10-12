const { v4: uuid } = require('uuid')
const StudentProfile = require('./models/StudentProfile')
const Drive = require('./models/Drive')
const Application = require('./models/Application')
const Assignment = require('./models/Assignment')
const Institution = require('./models/Institution')
const Batch = require('./models/Batch')
const eligibilityEngine = require('./services/eligibilityEngine')
const readinessService = require('./services/readinessService')
const atsMatcherService = require('./services/atsMatcherService')
const campusAnalyticsService = require('./services/campusAnalyticsService')
const AuditLog = require('../audit/AuditLog')

// ── 1. BULK ONBOARDING & CSV IMPORT ──────────────────────────────────────────

const bulkImportStudents = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId || 'inst-demo-campus'
    const { students = [], csvRaw = '' } = req.body

    let recordsToInsert = students

    // If raw CSV string is supplied, parse simple lines
    if (csvRaw && typeof csvRaw === 'string') {
      const lines = csvRaw.trim().split('\n').filter(l => l.trim().length > 0)
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        recordsToInsert = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim())
          const obj = {}
          headers.forEach((h, i) => obj[h] = vals[i])
          return {
            rollNumber: obj.rollnumber || obj.roll_number || obj.roll || `STU-${Math.floor(Math.random() * 90000 + 10000)}`,
            name: obj.name || 'Candidate',
            email: obj.email || `student_${Date.now()}@campus.edu`,
            department: (obj.department || obj.branch || 'CSE').toUpperCase(),
            batchYear: obj.batch || obj.batchyear || '2026',
            cgpa: parseFloat(obj.cgpa) || 7.0,
            backlogs: parseInt(obj.backlogs) || 0,
            skills: obj.skills ? obj.skills.split(';').map(s => s.trim()) : ['Data Structures', 'Python']
          }
        })
      }
    }

    if (!recordsToInsert || recordsToInsert.length === 0) {
      return res.status(400).json({ error: 'No student records provided for import' })
    }

    const results = []
    for (const record of recordsToInsert) {
      const existing = await StudentProfile.findOne({
        institutionId,
        $or: [{ rollNumber: record.rollNumber }, { email: record.email }]
      })

      if (existing) {
        existing.cgpa = record.cgpa !== undefined ? record.cgpa : existing.cgpa
        existing.backlogs = record.backlogs !== undefined ? record.backlogs : existing.backlogs
        if (record.skills) existing.skills = record.skills
        await existing.save()
        results.push(existing)
      } else {
        const newStudent = await StudentProfile.create({
          institutionId,
          rollNumber: record.rollNumber,
          name: record.name,
          email: record.email,
          phone: record.phone,
          department: record.department,
          batchYear: record.batchYear || '2026',
          cgpa: record.cgpa || 7.0,
          backlogs: record.backlogs || 0,
          skills: record.skills || [],
          verifiedByFaculty: false
        })
        await readinessService.updateAndSaveStudentReadiness(newStudent._id)
        results.push(newStudent)
      }
    }

    await AuditLog.record({
      institutionId,
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'roster:import',
      targetType: 'roster',
      details: { importedCount: results.length }
    })

    res.status(201).json({
      message: `Successfully processed ${results.length} student records`,
      count: results.length,
      sample: results.slice(0, 5)
    })
  } catch (err) {
    console.error('[Campus] Bulk import error:', err)
    res.status(500).json({ error: 'Bulk import failed: ' + err.message })
  }
}

// ── 2. FACULTY VERIFICATION OF PROFILE ───────────────────────────────────────

const verifyStudentProfile = async (req, res) => {
  try {
    const { id } = req.params
    const { verified = true } = req.body

    const student = await StudentProfile.findById(id)
    if (!student) return res.status(404).json({ error: 'Student profile not found' })

    student.verifiedByFaculty = verified
    student.verifiedBy = req.user.id
    student.verifiedAt = new Date()
    await student.save()

    // Recalculate readiness score now that consistency / verified status changed
    await readinessService.updateAndSaveStudentReadiness(student._id)

    await AuditLog.record({
      institutionId: student.institutionId,
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'student:verify',
      targetType: 'student',
      targetId: student._id.toString(),
      details: { verified, rollNumber: student.rollNumber }
    })

    res.json({ message: 'Student profile verified successfully', student })
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify profile' })
  }
}

// ── 3. DRIVE CREATION & MANAGEMENT ──────────────────────────────────────────

const createDrive = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const {
      company,
      role,
      salaryPackage,
      location,
      jdText,
      requiredSkills = [],
      eligibilityRules = {},
      rounds = [],
      dates = {}
    } = req.body

    const driveId = `drv_${Date.now()}`
    const defaultRounds = [
      { roundNumber: 1, name: 'Aptitude Screening', type: 'aptitude' },
      { roundNumber: 2, name: 'Technical Round 1', type: 'technical' },
      { roundNumber: 3, name: 'HR & Cultural Fit', type: 'hr' }
    ]

    const drive = await Drive.create({
      driveId,
      institutionId,
      company,
      role,
      salaryPackage,
      location,
      jdText,
      requiredSkills,
      eligibilityRules: {
        minCgpa: eligibilityRules.minCgpa !== undefined ? parseFloat(eligibilityRules.minCgpa) : 6.5,
        maxBacklogs: eligibilityRules.maxBacklogs !== undefined ? parseInt(eligibilityRules.maxBacklogs) : 0,
        allowedBranches: eligibilityRules.allowedBranches || ['CSE', 'IT'],
        batchYear: eligibilityRules.batchYear || '2026'
      },
      rounds: rounds.length > 0 ? rounds : defaultRounds,
      dates: {
        startDate: dates.startDate || new Date(),
        endDate: dates.endDate || new Date(Date.now() + 14 * 86400000),
        driveDate: dates.driveDate
      },
      createdBy: req.user.id,
      status: 'active'
    })

    // Compute eligible student pool immediately
    const pool = await eligibilityEngine.computeEligiblePool(driveId, institutionId)

    await AuditLog.record({
      institutionId,
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'drive:create',
      targetType: 'drive',
      targetId: driveId,
      details: { company, role, eligibleCount: pool.eligibleCount }
    })

    res.status(201).json({ drive, eligibleCount: pool.eligibleCount })
  } catch (err) {
    console.error('[Campus] Create drive error:', err)
    res.status(500).json({ error: 'Failed to create drive: ' + err.message })
  }
}

const listDrives = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const drives = await Drive.find({ institutionId }).sort({ createdAt: -1 })
    res.json(drives)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drives' })
  }
}

// ── 4. STUDENT ELIGIBLE DRIVES & APPLICATION ────────────────────────────────

const getEligibleDrivesForStudent = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    
    // Find student profile by userId or email
    const student = await StudentProfile.findOne({
      institutionId,
      $or: [{ userId: req.user.id }, { email: req.user.email }]
    })

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found for this account' })
    }

    const drives = await Drive.find({ institutionId, status: 'active' })
    const results = []

    for (const drive of drives) {
      const evaluation = eligibilityEngine.evaluateStudent(student, drive.eligibilityRules)
      const existingApp = await Application.findOne({ driveId: drive.driveId, studentProfileId: student._id.toString() })

      results.push({
        drive,
        isEligible: evaluation.isEligible,
        reasons: evaluation.reasons,
        hasApplied: !!existingApp,
        application: existingApp
      })
    }

    res.json({ student, drives: results })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch eligible drives' })
  }
}

const applyForDrive = async (req, res) => {
  try {
    const { id: driveId } = req.params
    const institutionId = req.user?.institutionId || 'inst-demo-campus'

    const drive = await Drive.findOne({ driveId, institutionId })
    if (!drive) return res.status(404).json({ error: 'Drive not found' })

    const student = await StudentProfile.findOne({
      institutionId,
      $or: [{ userId: req.user.id }, { email: req.user.email }]
    })
    if (!student) return res.status(404).json({ error: 'Student profile not found' })

    // Verify eligibility
    const evalResult = eligibilityEngine.evaluateStudent(student, drive.eligibilityRules)
    if (!evalResult.isEligible) {
      return res.status(400).json({
        error: 'You do not meet the criteria for this drive',
        reasons: evalResult.reasons
      })
    }

    // Check duplicate
    const existing = await Application.findOne({ driveId, studentProfileId: student._id.toString() })
    if (existing) {
      return res.status(409).json({ error: 'You have already applied to this drive', application: existing })
    }

    // Match resume against JD
    const resumeText = student.resumeVersions?.[0]?.parsedText || student.skills?.join(' ') || ''
    const matchResult = await atsMatcherService.matchResumeToJd(resumeText, drive.jdText, drive.requiredSkills)

    const app = await Application.create({
      applicationId: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      driveId,
      institutionId,
      studentProfileId: student._id.toString(),
      studentUserId: req.user.id,
      studentName: student.name,
      studentRoll: student.rollNumber,
      department: student.department,
      currentStage: 'Applied',
      stageHistory: [{ stage: 'Applied', changedAt: new Date(), changedBy: req.user.id }],
      resumeMatchScore: matchResult.matchScore,
      missingSkills: matchResult.missingSkills,
      matchExplanation: matchResult.explanation,
      readinessScoreSnapshot: student.readinessScore
    })

    drive.totalApplied = (drive.totalApplied || 0) + 1
    await drive.save().catch(() => null)

    res.status(201).json({ message: 'Application submitted successfully', application: app })
  } catch (err) {
    console.error('[Campus] Apply error:', err)
    res.status(500).json({ error: 'Application failed: ' + err.message })
  }
}

// ── 5. KANBAN ROUND TRACKING ────────────────────────────────────────────────

const updateApplicationStage = async (req, res) => {
  try {
    const { id: applicationId } = req.params
    const { stage, feedback } = req.body

    const validStages = ['Applied', 'Aptitude', 'Technical', 'HR', 'Offer', 'Rejected']
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` })
    }

    const application = await Application.findOne({
      $or: [{ applicationId }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? applicationId : null }]
    })
    if (!application) return res.status(404).json({ error: 'Application not found' })

    application.currentStage = stage
    application.stageHistory.push({
      stage,
      changedAt: new Date(),
      changedBy: req.user.id,
      feedback: feedback || ''
    })
    await application.save()

    await AuditLog.record({
      institutionId: application.institutionId,
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'application:stage_update',
      targetType: 'application',
      targetId: application.applicationId,
      details: { newStage: stage, studentRoll: application.studentRoll }
    })

    res.json({ message: 'Stage updated successfully', application })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application stage' })
  }
}

const getApplicationsForKanban = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const { driveId } = req.query

    const filter = { institutionId }
    if (driveId) filter.driveId = driveId

    const apps = await Application.find(filter).sort({ updatedAt: -1 })
    
    // Group by stage for the Kanban UI
    const kanban = {
      Applied: [],
      Aptitude: [],
      Technical: [],
      HR: [],
      Offer: [],
      Rejected: []
    }

    apps.forEach(app => {
      if (kanban[app.currentStage]) {
        kanban[app.currentStage].push(app)
      }
    })

    res.json({ applications: apps, kanban })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' })
  }
}

// ── 6. OFFICER ANALYTICS ────────────────────────────────────────────────────

const getCohortAnalytics = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const analytics = await campusAnalyticsService.getCohortAnalytics(institutionId)
    res.json(analytics)
  } catch (err) {
    console.error('[Campus] Analytics error:', err)
    res.status(500).json({ error: 'Failed to load cohort analytics' })
  }
}

// ── 7. FACULTY ASSIGNMENTS & LEADERBOARD ────────────────────────────────────

const createFacultyAssignment = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const {
      title,
      description,
      targetDepartment = 'CSE',
      targetBatchYear = '2026',
      targetSection = 'All',
      role = 'Full Stack Developer',
      company = 'Google',
      deadline
    } = req.body

    const assignmentId = `asgn_${Date.now()}`
    const assignment = await Assignment.create({
      assignmentId,
      institutionId,
      title,
      description,
      targetDepartment: targetDepartment.toUpperCase(),
      targetBatchYear,
      targetSection,
      role,
      company,
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 86400000),
      createdByFacultyId: req.user.id,
      createdByName: req.user.name
    })

    // Count matching students
    const count = await StudentProfile.countDocuments({
      institutionId,
      department: targetDepartment.toUpperCase(),
      batchYear: targetBatchYear
    })
    assignment.totalAssigned = count
    await assignment.save()

    res.status(201).json({ assignment })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' })
  }
}

const listFacultyAssignments = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const assignments = await Assignment.find({ institutionId }).sort({ createdAt: -1 })
    res.json(assignments)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' })
  }
}

// ── 8. ATS MATCH TEST ───────────────────────────────────────────────────────

const testAtsMatch = async (req, res) => {
  try {
    const { resumeText, jdText, requiredSkills } = req.body
    const result = await atsMatcherService.matchResumeToJd(resumeText, jdText, requiredSkills)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'ATS match failed' })
  }
}

module.exports = {
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
}
