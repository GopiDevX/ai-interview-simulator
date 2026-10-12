/**
 * Comprehensive Campus Monolith Demo Data Seeder
 * Seeds:
 * - Institution & Readiness Weights
 * - Departments & Batches
 * - Staff & Faculty Accounts (with secure hashed passwords)
 * - Verified Alumni Mentors with Published Slots
 * - Student Profiles with CGPA, Skills & Readiness Breakdowns
 * - Active Placement Drives with Eligibility Criteria
 * - Kanban Round Applications (Applied -> Aptitude -> Technical -> HR -> Offer)
 * - Alumni Scorecards (human ground truth for ML)
 * - Approved Company Interview Experiences
 * - Audit Logs
 * 
 * Usage: node src/scripts/seedCampusData.js
 */

const dotenv = require('dotenv')
const path = require('path')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

dotenv.config({ path: path.join(__dirname, '../../.env') })

const { connectMongo } = require('../config/db')
const User = require('../models/mongo/User')
const Institution = require('../modules/campus/models/Institution')
const Department = require('../modules/campus/models/Department')
const Batch = require('../modules/campus/models/Batch')
const StudentProfile = require('../modules/campus/models/StudentProfile')
const Drive = require('../modules/campus/models/Drive')
const Application = require('../modules/campus/models/Application')
const Assignment = require('../modules/campus/models/Assignment')
const AlumniProfile = require('../modules/alumni/models/AlumniProfile')
const Slot = require('../modules/alumni/models/Slot')
const AlumniScorecard = require('../modules/alumni/models/AlumniScorecard')
const ExperienceReport = require('../modules/alumni/models/ExperienceReport')
const DocumentEmbedding = require('../models/mongo/DocumentEmbedding')
const AuditLog = require('../modules/audit/AuditLog')
const readinessService = require('../modules/campus/services/readinessService')
const ragService = require('../services/ragService')

async function seedCampusData() {
  console.log('[Seed] Connecting to database...')
  await connectMongo()

  const institutionId = 'inst-demo-campus'
  const defaultPassword = 'CampusUser@2026'
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  // 1. Seed Institution
  console.log('[Seed] Creating Institution...')
  await Institution.findOneAndUpdate(
    { institutionId },
    {
      institutionId,
      name: 'BITS Pilani Campus',
      code: 'BITS',
      domain: 'campus.edu',
      address: 'Vidya Vihar, Pilani, Rajasthan',
      readinessWeights: {
        mockScore: 0.35,
        codeScore: 0.30,
        resumeJDMatch: 0.20,
        consistency: 0.15
      }
    },
    { upsert: true, new: true }
  )

  // 2. Seed Departments
  console.log('[Seed] Creating Departments...')
  const depts = [
    { code: 'CSE', name: 'Computer Science and Engineering', headOfDepartment: 'Dr. S. Sharma' },
    { code: 'IT', name: 'Information Technology', headOfDepartment: 'Dr. P. Verma' },
    { code: 'ECE', name: 'Electronics and Communication', headOfDepartment: 'Dr. R. Iyer' }
  ]
  for (const d of depts) {
    await Department.findOneAndUpdate(
      { institutionId, code: d.code },
      { ...d, institutionId },
      { upsert: true }
    )
  }

  // 3. Seed Batches
  console.log('[Seed] Creating Batches...')
  await Batch.findOneAndUpdate(
    { institutionId, departmentCode: 'CSE', year: '2026', section: 'A' },
    { institutionId, departmentCode: 'CSE', year: '2026', section: 'A', studentCount: 65 },
    { upsert: true }
  )

  // 4. Seed Core Users (Admin, Placement Officer, Faculty, Alumni)
  console.log('[Seed] Seeding Core Users...')
  const users = [
    { name: 'Dr. Arvind Rao', email: 'officer@campus.edu', role: 'placement_officer' },
    { name: 'Prof. Sneha Kulkarni', email: 'faculty@campus.edu', role: 'faculty' },
    { name: 'Vikram Mehta', email: 'alumni.google@campus.edu', role: 'alumni' },
    { name: 'Ananya Deshmukh', email: 'alumni.msft@campus.edu', role: 'alumni' },
    { name: 'Aarav Patel', email: 'student1@campus.edu', role: 'student', rollNumber: '2026CSE01' },
    { name: 'Diya Nair', email: 'student2@campus.edu', role: 'student', rollNumber: '2026CSE02' },
    { name: 'Rohan Joshi', email: 'student3@campus.edu', role: 'student', rollNumber: '2026IT05' }
  ]

  const createdUsers = {}
  for (const u of users) {
    const user = await User.findOneAndUpdate(
      { email: u.email },
      {
        ...u,
        institutionId,
        collegeId: institutionId,
        passwordHash,
        tier: 'pro'
      },
      { upsert: true, new: true }
    )
    createdUsers[u.email] = user
  }

  // 5. Seed Alumni Profiles & Slots
  console.log('[Seed] Creating Alumni Profiles & Availability Slots...')
  const alumniProfiles = [
    {
      user: createdUsers['alumni.google@campus.edu'],
      company: 'Google',
      role: 'Senior Software Engineer (SDE-2)',
      graduationYear: '2022',
      expertiseTags: ['Distributed Systems', 'Go', 'Kubernetes', 'System Design'],
      bio: 'Ex-intern, now 3+ years at Google Cloud Core Infrastructure.'
    },
    {
      user: createdUsers['alumni.msft@campus.edu'],
      company: 'Microsoft',
      role: 'Software Development Engineer II',
      graduationYear: '2023',
      expertiseTags: ['Azure Functions', 'C#', 'SQL Scalability', 'React'],
      bio: 'Specializing in cloud resilience and enterprise backend services.'
    }
  ]

  const seededAlumni = []
  for (const ap of alumniProfiles) {
    const profile = await AlumniProfile.findOneAndUpdate(
      { email: ap.user.email },
      {
        institutionId,
        userId: ap.user._id.toString(),
        name: ap.user.name,
        email: ap.user.email,
        company: ap.company,
        role: ap.role,
        graduationYear: ap.graduationYear,
        expertiseTags: ap.expertiseTags,
        bio: ap.bio,
        isVerified: true,
        verificationMethod: 'officer_approval',
        rating: 4.9
      },
      { upsert: true, new: true }
    )
    seededAlumni.push(profile)

    // Publish upcoming slots
    await Slot.create({
      alumniProfileId: profile._id.toString(),
      alumniUserId: ap.user._id.toString(),
      alumniName: ap.user.name,
      institutionId,
      startTime: new Date(Date.now() + 2 * 86400000), // +2 days
      endTime: new Date(Date.now() + 2 * 86400000 + 3600000),
      topic: 'Mock Technical System Design Drill',
      status: 'available'
    }).catch(() => null)
  }

  // 6. Seed Student Profiles
  console.log('[Seed] Creating Student Profiles & Computing Readiness...')
  const studentsData = [
    {
      user: createdUsers['student1@campus.edu'],
      rollNumber: '2026CSE01',
      department: 'CSE',
      cgpa: 8.8,
      backlogs: 0,
      skills: ['Data Structures', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
      mockCount: 4,
      readinessBreakdown: { mockAvg: 85, codeScore: 90, resumeJDMatch: 82, consistencyScore: 95 }
    },
    {
      user: createdUsers['student2@campus.edu'],
      rollNumber: '2026CSE02',
      department: 'CSE',
      cgpa: 7.4,
      backlogs: 0,
      skills: ['Python', 'Django', 'MongoDB', 'JavaScript'],
      mockCount: 2,
      readinessBreakdown: { mockAvg: 70, codeScore: 72, resumeJDMatch: 68, consistencyScore: 75 }
    },
    {
      user: createdUsers['student3@campus.edu'],
      rollNumber: '2026IT05',
      department: 'IT',
      cgpa: 6.2,
      backlogs: 1,
      skills: ['HTML', 'CSS', 'JavaScript'],
      mockCount: 0,
      readinessBreakdown: { mockAvg: 40, codeScore: 50, resumeJDMatch: 55, consistencyScore: 50 }
    }
  ]

  const seededStudents = []
  for (const s of studentsData) {
    const profile = await StudentProfile.findOneAndUpdate(
      { email: s.user.email },
      {
        institutionId,
        userId: s.user._id.toString(),
        name: s.user.name,
        email: s.user.email,
        rollNumber: s.rollNumber,
        department: s.department,
        batchYear: '2026',
        cgpa: s.cgpa,
        backlogs: s.backlogs,
        skills: s.skills,
        mockCount: s.mockCount,
        readinessBreakdown: s.readinessBreakdown,
        verifiedByFaculty: true
      },
      { upsert: true, new: true }
    )
    await readinessService.updateAndSaveStudentReadiness(profile._id)
    seededStudents.push(profile)
  }

  // 7. Seed Placement Drives
  console.log('[Seed] Creating Active Placement Drives...')
  const drivesData = [
    {
      driveId: 'drv_google_2026',
      company: 'Google',
      role: 'Software Engineer (L3)',
      salaryPackage: '22 LPA',
      location: 'Hyderabad / Bangalore',
      jdText: 'Looking for high-caliber graduates with solid foundations in Data Structures, Algorithms, Distributed Caching, and Multithreading.',
      requiredSkills: ['Data Structures', 'Algorithms', 'Go', 'Java', 'Distributed Systems'],
      eligibilityRules: { minCgpa: 7.5, maxBacklogs: 0, allowedBranches: ['CSE', 'IT'], batchYear: '2026' }
    },
    {
      driveId: 'drv_msft_2026',
      company: 'Microsoft',
      role: 'Software Development Engineer (Azure)',
      salaryPackage: '18 LPA',
      location: 'Bangalore / Noida',
      jdText: 'Design cloud microservices with C#, Python or Node.js. Requires understanding of REST APIs, SQL database indexing, and Docker.',
      requiredSkills: ['Cloud', 'REST', 'Node.js', 'SQL', 'Docker'],
      eligibilityRules: { minCgpa: 7.0, maxBacklogs: 0, allowedBranches: ['CSE', 'IT', 'ECE'], batchYear: '2026' }
    }
  ]

  for (const d of drivesData) {
    await Drive.findOneAndUpdate(
      { driveId: d.driveId },
      {
        ...d,
        institutionId,
        status: 'active',
        dates: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 10 * 86400000),
          driveDate: new Date(Date.now() + 14 * 86400000)
        }
      },
      { upsert: true }
    )
  }

  // 8. Seed Applications across Kanban Stages
  console.log('[Seed] Seeding Kanban Applications...')
  const s1 = seededStudents[0]
  const s2 = seededStudents[1]

  await Application.findOneAndUpdate(
    { driveId: 'drv_google_2026', studentProfileId: s1._id.toString() },
    {
      applicationId: 'app_g_001',
      driveId: 'drv_google_2026',
      institutionId,
      studentProfileId: s1._id.toString(),
      studentUserId: s1.userId,
      studentName: s1.name,
      studentRoll: s1.rollNumber,
      department: s1.department,
      currentStage: 'Technical',
      stageHistory: [
        { stage: 'Applied', changedAt: new Date(Date.now() - 3 * 86400000) },
        { stage: 'Aptitude', changedAt: new Date(Date.now() - 2 * 86400000) },
        { stage: 'Technical', changedAt: new Date(Date.now() - 86400000) }
      ],
      resumeMatchScore: 88,
      missingSkills: ['Distributed Systems'],
      readinessScoreSnapshot: s1.readinessScore
    },
    { upsert: true }
  )

  await Application.findOneAndUpdate(
    { driveId: 'drv_msft_2026', studentProfileId: s2._id.toString() },
    {
      applicationId: 'app_m_002',
      driveId: 'drv_msft_2026',
      institutionId,
      studentProfileId: s2._id.toString(),
      studentUserId: s2.userId,
      studentName: s2.name,
      studentRoll: s2.rollNumber,
      department: s2.department,
      currentStage: 'Applied',
      stageHistory: [{ stage: 'Applied', changedAt: new Date() }],
      resumeMatchScore: 74,
      missingSkills: ['Docker', 'Cloud'],
      readinessScoreSnapshot: s2.readinessScore
    },
    { upsert: true }
  )

  // 9. Seed Alumni Scorecard (ML Ground Truth)
  console.log('[Seed] Creating Alumni Rubric Scorecards...')
  await AlumniScorecard.create({
    mentorshipRequestId: 'mr_demo_01',
    sessionId: 'session_demo_01',
    institutionId,
    alumniProfileId: seededAlumni[0]._id.toString(),
    alumniName: seededAlumni[0].name,
    alumniCompany: 'Google',
    studentProfileId: s1._id.toString(),
    studentName: s1.name,
    studentRoll: s1.rollNumber,
    roleEvaluated: 'SDE-1',
    rubric: {
      communication: 9.0,
      depth: 8.5,
      problemSolving: 9.0,
      overallScore: 8.8
    },
    derivedQualityLabel: 'excellent',
    hireRecommendation: 'strong_hire',
    strengths: ['Clear explanation of hash table collisions', 'Clean modular code structure'],
    areasOfImprovement: ['Elaborate more on distributed cache replication trade-offs'],
    writtenFeedback: 'Candidate demonstrates strong grasp of algorithmic complexity and communicates trade-offs transparently.'
  }).catch(() => null)

  // 10. Seed Approved Experience Report (Indexed in RAG)
  console.log('[Seed] Creating Approved Experience Report & RAG vector...')
  const exp = await ExperienceReport.create({
    institutionId,
    alumniProfileId: seededAlumni[0]._id.toString(),
    alumniName: seededAlumni[0].name,
    company: 'Google',
    role: 'SDE-1',
    interviewYear: '2024',
    overallDifficulty: 'Hard',
    rounds: [
      {
        roundName: 'Online Assessment',
        difficulty: 'Medium',
        questionsAsked: ['2 LeetCode Medium array & sliding window problems']
      },
      {
        roundName: 'Virtual Onsite Technical',
        difficulty: 'Hard',
        questionsAsked: ['Design distributed LRU Cache with TTL', 'Concurrency synchronization in Java/Go']
      }
    ],
    preparationTips: 'Focus heavily on BFS/DFS graph traversals and clear verbal communication during problem solving.',
    moderationStatus: 'approved',
    indexedInRag: true
  }).catch(() => null)

  if (exp) {
    const text = `Company: Google. Role: SDE-1. Rounds: Online Assessment and Virtual Onsite. Focus on distributed cache and sliding window. Tips: ${exp.preparationTips}`
    const [vec] = await ragService.embedChunks([text])
    if (vec) {
      await DocumentEmbedding.persistVectors({
        institutionId,
        docType: 'alumni_experience',
        chunks: [{ text, section: 'ALUMNI_EXPERIENCE_GOOGLE' }],
        embeddings: [vec],
        metadata: { title: 'Google SDE-1 Interview Experience', company: 'Google' }
      })
    }
  }

  // 11. Seed Audit Log
  await AuditLog.record({
    institutionId,
    actorId: createdUsers['officer@campus.edu']._id.toString(),
    actorEmail: 'officer@campus.edu',
    actorRole: 'placement_officer',
    action: 'system:seed',
    targetType: 'institution',
    targetId: institutionId,
    details: { message: 'Demo campus data successfully seeded' }
  })

  console.log('\n================================================================')
  console.log('✅ CAMPUS DEMO DATA SEEDING COMPLETE!')
  console.log('================================================================')
  console.log('Default Password for all seeded accounts:', defaultPassword)
  console.log('\nSeeded Accounts:')
  console.log('  • Placement Officer: officer@campus.edu')
  console.log('  • Faculty Advisor:   faculty@campus.edu')
  console.log('  • Alumni Mentor:     alumni.google@campus.edu')
  console.log('  • Student (Tier 1):  student1@campus.edu')
  console.log('  • Student (Tier 2):  student2@campus.edu')
  console.log('================================================================\n')

  await mongoose.disconnect()
}

if (require.main === module) {
  seedCampusData().then(() => process.exit(0)).catch(err => {
    console.error('[Seed] Failed:', err)
    process.exit(1)
  })
}

module.exports = { seedCampusData }
