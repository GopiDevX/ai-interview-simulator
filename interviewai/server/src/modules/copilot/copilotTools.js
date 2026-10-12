const StudentProfile = require('../campus/models/StudentProfile')
const Drive = require('../campus/models/Drive')
const Application = require('../campus/models/Application')
const AlumniProfile = require('../alumni/models/AlumniProfile')
const Slot = require('../alumni/models/Slot')
const MentorshipRequest = require('../alumni/models/MentorshipRequest')
const campusAnalyticsService = require('../campus/services/campusAnalyticsService')
const eligibilityEngine = require('../campus/services/eligibilityEngine')

const mongoose = require('mongoose')
const isMongoConnected = () => mongoose.connection.readyState === 1

/**
 * Predefined Copilot Tool Function Declarations for Gemini Function Calling
 */
const TOOL_DEFINITIONS = [
  {
    name: 'get_my_eligible_drives',
    description: 'Fetch placement drives for which the authenticated student is eligible based on CGPA and branch.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_my_weak_topics',
    description: 'Analyze the student\'s past mock sessions and identify skill topics needing urgent practice.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  },
  {
    name: 'find_alumni',
    description: 'Find verified alumni mentors working at a specific company or possessing a specific technical skill.',
    parameters: {
      type: 'OBJECT',
      properties: {
        company: { type: 'STRING', description: 'Target company name, e.g. Google, Microsoft, Amazon' },
        skill: { type: 'STRING', description: 'Technical expertise, e.g. System Design, React, Distributed Systems' }
      },
      required: []
    }
  },
  {
    name: 'book_mock_interview',
    description: 'Schedule a live mock interview or mentorship session with an alumni mentor. (Requires confirmation)',
    parameters: {
      type: 'OBJECT',
      properties: {
        alumniId: { type: 'STRING', description: 'Alumni Profile ID' },
        slotId: { type: 'STRING', description: 'Availability Slot ID' },
        topic: { type: 'STRING', description: 'Topic to practice' }
      },
      required: ['alumniId']
    }
  },
  {
    name: 'get_cohort_stats',
    description: 'Fetch aggregate cohort analytics and skill gap heatmap. Strictly restricted to placement officers and faculty.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  }
]

/**
 * Execute tool call strictly under the caller's JWT user identity and permissions
 */
async function executeTool(toolName, args, user, confirmed = false) {
  const institutionId = user.institutionId || 'inst-demo-campus'

  // Tool 1: get_my_eligible_drives
  if (toolName === 'get_my_eligible_drives') {
    let student = null
    let drives = []
    if (isMongoConnected()) {
      try {
        student = await StudentProfile.findOne({
          institutionId,
          $or: [{ userId: user.id }, { email: user.email }]
        }).maxTimeMS(2000)
        drives = await Drive.find({ institutionId, status: 'active' }).maxTimeMS(2000).lean()
      } catch { /* fallback */ }
    }

    if (!student) {
      student = { name: user.name || 'Candidate', cgpa: 8.2, department: 'CSE', rollNumber: '2026CSE01', backlogs: 0 }
    }
    if (!drives || drives.length === 0) {
      drives = [
        { driveId: 'drv_g_1', company: 'Google', role: 'Software Engineer', salaryPackage: '22 LPA', dates: { endDate: new Date(Date.now() + 7 * 86400000) }, eligibilityRules: { minCgpa: 7.5, allowedBranches: ['CSE', 'IT'] } },
        { driveId: 'drv_m_1', company: 'Microsoft', role: 'Cloud SDE', salaryPackage: '18 LPA', dates: { endDate: new Date(Date.now() + 10 * 86400000) }, eligibilityRules: { minCgpa: 7.0, allowedBranches: ['CSE', 'IT', 'ECE'] } }
      ]
    }

    const eligible = []
    for (const d of drives) {
      const evalRes = eligibilityEngine.evaluateStudent(student, d.eligibilityRules)
      if (evalRes.isEligible) {
        eligible.push({
          driveId: d.driveId,
          company: d.company,
          role: d.role,
          package: d.salaryPackage,
          deadline: d.dates?.endDate
        })
      }
    }
    return {
      studentName: student.name,
      cgpa: student.cgpa,
      eligibleDriveCount: eligible.length,
      eligibleDrives: eligible
    }
  }

  // Tool 2: get_my_weak_topics
  if (toolName === 'get_my_weak_topics') {
    let student = null
    if (isMongoConnected()) {
      try {
        student = await StudentProfile.findOne({
          institutionId,
          $or: [{ userId: user.id }, { email: user.email }]
        }).maxTimeMS(2000)
      } catch { /* fallback */ }
    }
    const skills = student?.skills || ['JavaScript', 'HTML']
    const coreCurriculum = ['System Design', 'Dynamic Programming', 'SQL Indexing', 'Concurrency', 'Microservices']
    const weakTopics = coreCurriculum.filter(c => !skills.some(s => s.toLowerCase().includes(c.toLowerCase().split(' ')[0])))

    return {
      studentRoll: student?.rollNumber || 'STU-01',
      readinessScore: student?.readinessScore || 68,
      readinessTier: student?.readinessTier || 'Tier 2 Ready',
      detectedWeakTopics: weakTopics,
      recommendedAction: 'Queue 3 targeted practice rounds on ' + weakTopics.slice(0, 2).join(' and ')
    }
  }

  // Tool 3: find_alumni
  if (toolName === 'find_alumni') {
    let mentors = []
    if (isMongoConnected()) {
      try {
        const filter = { institutionId, isVerified: true }
        if (args.company) filter.company = new RegExp(args.company, 'i')
        if (args.skill) filter.expertiseTags = new RegExp(args.skill, 'i')
        mentors = await AlumniProfile.find(filter).limit(5).maxTimeMS(2000).lean()
      } catch { /* fallback */ }
    }

    if (!mentors || mentors.length === 0) {
      mentors = [
        { _id: 'alm_1', name: 'Vikram Mehta', company: args.company || 'Google', role: 'Senior SDE', expertiseTags: ['Distributed Systems', 'System Design'], rating: 4.9 },
        { _id: 'alm_2', name: 'Ananya Deshmukh', company: args.company || 'Microsoft', role: 'SDE II', expertiseTags: ['Azure Functions', 'Cloud Architecture'], rating: 4.8 }
      ]
    }

    return {
      query: { company: args.company, skill: args.skill },
      matchCount: mentors.length,
      mentors: mentors.map(m => ({
        alumniId: m._id ? m._id.toString() : m.id,
        name: m.name,
        company: m.company,
        role: m.role,
        expertiseTags: m.expertiseTags,
        rating: m.rating
      }))
    }
  }

  // Tool 4: book_mock_interview (Write Action -> Requires Confirmation)
  if (toolName === 'book_mock_interview') {
    if (!confirmed) {
      return {
        status: 'confirmation_required',
        message: `Please confirm: Would you like to schedule a mock interview with Alumni mentor on "${args.topic || 'System Design'}"?`,
        pendingAction: {
          toolName: 'book_mock_interview',
          args
        }
      }
    }

    // Execute actual booking
    const alumni = await AlumniProfile.findById(args.alumniId)
    if (!alumni) return { error: 'Alumni not found' }

    const roomId = `p2p_copilot_${Math.random().toString(36).substr(2, 8)}`
    const request = await MentorshipRequest.create({
      institutionId,
      studentProfileId: user.id,
      studentUserId: user.id,
      studentName: user.name,
      alumniProfileId: alumni._id.toString(),
      alumniName: alumni.name,
      company: alumni.company,
      topic: args.topic || 'Mock Technical Practice via Copilot',
      goalsText: 'Auto-booked by Placement Copilot',
      slotId: args.slotId || null,
      scheduledAt: new Date(Date.now() + 86400000), // Next day default
      roomId,
      status: 'accepted'
    })

    return {
      status: 'confirmed_and_booked',
      message: `Mock interview booked with ${alumni.name} (${alumni.company})! Room is ready.`,
      roomId,
      scheduledAt: request.scheduledAt
    }
  }

  // Tool 5: get_cohort_stats (Officer only)
  if (toolName === 'get_cohort_stats') {
    if (!['placement_officer', 'faculty', 'admin'].includes(user.role)) {
      return {
        error: 'Forbidden: Cohort statistics can only be queried by placement officers or faculty.'
      }
    }
    const analytics = await campusAnalyticsService.getCohortAnalytics(institutionId)
    return {
      overview: analytics.overview,
      skillHeatmapSummary: analytics.skillHeatmap.slice(0, 4)
    }
  }

  return { error: `Unknown tool: ${toolName}` }
}

module.exports = {
  TOOL_DEFINITIONS,
  executeTool
}
