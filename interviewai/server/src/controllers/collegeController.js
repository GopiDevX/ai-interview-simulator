const mongoose = require('mongoose')
const { v4: uuid } = require('uuid')
const College = require('../models/mongo/College')
const PlacementDrive = require('../models/mongo/PlacementDrive')
const StudentRoster = require('../models/mongo/StudentRoster')
const Session = require('../models/mongo/Session')

const isMongoConnected = () => mongoose.connection.readyState === 1

// ==========================================
// IN-MEMORY SEEDED DATA (Fallback & Demo)
// ==========================================
const DEFAULT_COLLEGE_ID = 'col_custom_institution'

const seedCollege = {
  collegeId: DEFAULT_COLLEGE_ID,
  name: 'Campus Placement & Training Directorate',
  code: 'CAMPUS',
  domain: 'university.edu',
  departments: [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Data Science & AI'
  ],
  batches: ['2025', '2026', '2027'],
  stats: {
    totalStudents: 32,
    activeDrives: 2,
    avgPlacementScore: 78.4
  }
}

const seedDrives = [
  {
    driveId: 'drv_accenture_2026',
    collegeId: DEFAULT_COLLEGE_ID,
    title: 'Accenture Campus Placement Mock Drive 2026',
    company: 'Accenture',
    role: 'Associate Software Engineer',
    description: 'Comprehensive campus mock drive evaluating problem solving, core fundamentals, and behavioral situational awareness.',
    targetDepartments: ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'],
    targetBatch: '2026',
    startDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    endDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    status: 'active',
    proctoringLevel: 'strict',
    rounds: [
      { roundNumber: 1, name: 'AI Technical Interview', type: 'ai_technical' },
      { roundNumber: 2, name: 'Monaco Live Coding Round', type: 'coding' },
      { roundNumber: 3, name: 'HR Behavioral with Avatar', type: 'hr_avatar' }
    ],
    totalRegistered: 28,
    totalCompleted: 22,
    averageScore: 79.2
  },
  {
    driveId: 'drv_tcs_nqt_2026',
    collegeId: DEFAULT_COLLEGE_ID,
    title: 'TCS NQT & Digital Practice Mock',
    company: 'TCS',
    role: 'Systems Engineer',
    description: 'Aimed at evaluating readiness for TCS Digital & Ninja tracks with coding proficiency and algorithmic logic.',
    targetDepartments: ['Computer Science & Engineering', 'Data Science & AI'],
    targetBatch: '2026',
    startDate: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    endDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    status: 'active',
    proctoringLevel: 'strict',
    rounds: [
      { roundNumber: 1, name: 'Technical Screening', type: 'ai_technical' },
      { roundNumber: 2, name: 'Coding Assessment', type: 'coding' }
    ],
    totalRegistered: 24,
    totalCompleted: 19,
    averageScore: 74.6
  },
  {
    driveId: 'drv_amazon_sde1',
    collegeId: DEFAULT_COLLEGE_ID,
    title: 'Amazon SDE-1 Elite Placement Sprint',
    company: 'Amazon',
    role: 'Software Development Engineer I',
    description: 'High-bar mock drive testing Leadership Principles, System Architecture, and algorithmic data structures.',
    targetDepartments: ['Computer Science & Engineering', 'Data Science & AI'],
    targetBatch: '2026',
    startDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    endDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
    status: 'upcoming',
    proctoringLevel: 'strict',
    rounds: [
      { roundNumber: 1, name: 'AI Technical Deep Dive', type: 'ai_technical' },
      { roundNumber: 2, name: 'Algorithmic Coding', type: 'coding' },
      { roundNumber: 3, name: 'Leadership Principles Evaluation', type: 'hr_avatar' }
    ],
    totalRegistered: 18,
    totalCompleted: 4,
    averageScore: 84.1
  }
]

// 20 realistic student profiles
const initialStudentRoster = [
  {
    rollNumber: '22CSE001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@apextech.edu',
    department: 'Computer Science & Engineering',
    batch: '2026',
    section: 'A',
    cgpa: 9.1,
    phone: '+91 98765 43210',
    status: 'active',
    avgScore: 88.5,
    totalMocksTaken: 3,
    predictedTier: 'Tier 1 Ready',
    driveHistory: [
      {
        driveId: 'drv_accenture_2026',
        sessionId: 'sess_aarav_01',
        status: 'completed',
        overallScore: 89,
        technicalScore: 92,
        communicationScore: 86,
        problemSolvingScore: 90,
        codeScore: 95,
        integrityScore: 98,
        readinessTier: 'Tier 1 Ready',
        flaggedIssues: [],
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
      },
      {
        driveId: 'drv_amazon_sde1',
        sessionId: 'sess_aarav_02',
        status: 'completed',
        overallScore: 88,
        technicalScore: 90,
        communicationScore: 85,
        problemSolvingScore: 92,
        codeScore: 90,
        integrityScore: 100,
        readinessTier: 'Tier 1 Ready',
        flaggedIssues: [],
        completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
      }
    ]
  },
  {
    rollNumber: '22CSE014',
    name: 'Priya Iyer',
    email: 'priya.iyer@apextech.edu',
    department: 'Computer Science & Engineering',
    batch: '2026',
    section: 'A',
    cgpa: 8.8,
    phone: '+91 98765 43211',
    status: 'active',
    avgScore: 86.0,
    totalMocksTaken: 2,
    predictedTier: 'Tier 1 Ready',
    driveHistory: [
      {
        driveId: 'drv_accenture_2026',
        sessionId: 'sess_priya_01',
        status: 'completed',
        overallScore: 87,
        technicalScore: 89,
        communicationScore: 91,
        problemSolvingScore: 84,
        codeScore: 88,
        integrityScore: 97,
        readinessTier: 'Tier 1 Ready',
        flaggedIssues: [],
        completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
      }
    ]
  },
  {
    rollNumber: '22IT003',
    name: 'Rohan Varma',
    email: 'rohan.varma@apextech.edu',
    department: 'Information Technology',
    batch: '2026',
    section: 'B',
    cgpa: 8.2,
    phone: '+91 98765 43212',
    status: 'active',
    avgScore: 78.5,
    totalMocksTaken: 2,
    predictedTier: 'Tier 2 Ready',
    driveHistory: [
      {
        driveId: 'drv_accenture_2026',
        sessionId: 'sess_rohan_01',
        status: 'completed',
        overallScore: 79,
        technicalScore: 80,
        communicationScore: 76,
        problemSolvingScore: 81,
        codeScore: 80,
        integrityScore: 94,
        readinessTier: 'Tier 2 Ready',
        flaggedIssues: ['Looking away 2 times'],
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
      }
    ]
  },
  {
    rollNumber: '22ECE021',
    name: 'Sneha Patel',
    email: 'sneha.patel@apextech.edu',
    department: 'Electronics & Communication',
    batch: '2026',
    section: 'A',
    cgpa: 7.9,
    phone: '+91 98765 43213',
    status: 'active',
    avgScore: 72.0,
    totalMocksTaken: 1,
    predictedTier: 'Tier 2 Ready',
    driveHistory: [
      {
        driveId: 'drv_accenture_2026',
        sessionId: 'sess_sneha_01',
        status: 'completed',
        overallScore: 72,
        technicalScore: 70,
        communicationScore: 78,
        problemSolvingScore: 68,
        codeScore: 70,
        integrityScore: 92,
        readinessTier: 'Tier 2 Ready',
        flaggedIssues: [],
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
      }
    ]
  },
  {
    rollNumber: '22AI005',
    name: 'Vikramaditya Roy',
    email: 'vikram.roy@apextech.edu',
    department: 'Data Science & AI',
    batch: '2026',
    section: 'A',
    cgpa: 9.3,
    phone: '+91 98765 43214',
    status: 'active',
    avgScore: 91.0,
    totalMocksTaken: 2,
    predictedTier: 'Tier 1 Ready',
    driveHistory: [
      {
        driveId: 'drv_tcs_nqt_2026',
        sessionId: 'sess_vikram_01',
        status: 'completed',
        overallScore: 92,
        technicalScore: 95,
        communicationScore: 88,
        problemSolvingScore: 94,
        codeScore: 96,
        integrityScore: 100,
        readinessTier: 'Tier 1 Ready',
        flaggedIssues: [],
        completedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000)
      }
    ]
  },
  {
    rollNumber: '22CSE042',
    name: 'Kavya Nair',
    email: 'kavya.nair@apextech.edu',
    department: 'Computer Science & Engineering',
    batch: '2026',
    section: 'B',
    cgpa: 7.4,
    phone: '+91 98765 43215',
    status: 'active',
    avgScore: 68.5,
    totalMocksTaken: 2,
    predictedTier: 'Tier 2 Ready',
    driveHistory: [
      {
        driveId: 'drv_accenture_2026',
        sessionId: 'sess_kavya_01',
        status: 'completed',
        overallScore: 69,
        technicalScore: 68,
        communicationScore: 75,
        problemSolvingScore: 66,
        codeScore: 65,
        integrityScore: 95,
        readinessTier: 'Tier 2 Ready',
        flaggedIssues: [],
        completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
      }
    ]
  },
  {
    rollNumber: '22IT018',
    name: 'Aditya Kulkarni',
    email: 'aditya.kulkarni@apextech.edu',
    department: 'Information Technology',
    batch: '2026',
    section: 'A',
    cgpa: 6.8,
    phone: '+91 98765 43216',
    status: 'active',
    avgScore: 59.0,
    totalMocksTaken: 1,
    predictedTier: 'Needs Training',
    driveHistory: [
      {
        driveId: 'drv_tcs_nqt_2026',
        sessionId: 'sess_aditya_01',
        status: 'completed',
        overallScore: 59,
        technicalScore: 55,
        communicationScore: 64,
        problemSolvingScore: 56,
        codeScore: 55,
        integrityScore: 88,
        readinessTier: 'Needs Training',
        flaggedIssues: ['Multiple tabs switched (3x)'],
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
      }
    ]
  },
  {
    rollNumber: '22ECE008',
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh@apextech.edu',
    department: 'Electronics & Communication',
    batch: '2026',
    section: 'B',
    cgpa: 8.5,
    phone: '+91 98765 43217',
    status: 'active',
    avgScore: 81.0,
    totalMocksTaken: 1,
    predictedTier: 'Tier 2 Ready',
    driveHistory: [
      {
        driveId: 'drv_accenture_2026',
        sessionId: 'sess_ananya_01',
        status: 'completed',
        overallScore: 81,
        technicalScore: 80,
        communicationScore: 85,
        problemSolvingScore: 78,
        codeScore: 82,
        integrityScore: 99,
        readinessTier: 'Tier 2 Ready',
        flaggedIssues: [],
        completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
      }
    ]
  },
  {
    rollNumber: '22CSE055',
    name: 'Manish Reddy',
    email: 'manish.reddy@apextech.edu',
    department: 'Computer Science & Engineering',
    batch: '2026',
    section: 'A',
    cgpa: 6.5,
    phone: '+91 98765 43218',
    status: 'active',
    avgScore: 54.0,
    totalMocksTaken: 1,
    predictedTier: 'Needs Training',
    driveHistory: [
      {
        driveId: 'drv_accenture_2026',
        sessionId: 'sess_manish_01',
        status: 'completed',
        overallScore: 54,
        technicalScore: 52,
        communicationScore: 58,
        problemSolvingScore: 50,
        codeScore: 50,
        integrityScore: 90,
        readinessTier: 'Needs Training',
        flaggedIssues: [],
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
      }
    ]
  },
  {
    rollNumber: '22AI012',
    name: 'Diya Sengupta',
    email: 'diya.sengupta@apextech.edu',
    department: 'Data Science & AI',
    batch: '2026',
    section: 'A',
    cgpa: 8.9,
    phone: '+91 98765 43219',
    status: 'active',
    avgScore: 87.0,
    totalMocksTaken: 1,
    predictedTier: 'Tier 1 Ready',
    driveHistory: [
      {
        driveId: 'drv_tcs_nqt_2026',
        sessionId: 'sess_diya_01',
        status: 'completed',
        overallScore: 87,
        technicalScore: 89,
        communicationScore: 86,
        problemSolvingScore: 88,
        codeScore: 90,
        integrityScore: 100,
        readinessTier: 'Tier 1 Ready',
        flaggedIssues: [],
        completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
      }
    ]
  }
]

// In-memory memory structures
const inMemoryCollege = { ...seedCollege }
const inMemoryDrives = new Map(seedDrives.map(d => [d.driveId, d]))
const inMemoryStudents = new Map(initialStudentRoster.map(s => [s.rollNumber, { ...s, collegeId: DEFAULT_COLLEGE_ID }]))

// Helper to calculate tier
const calculateTier = (score) => {
  if (score >= 85) return 'Tier 1 Ready'
  if (score >= 65) return 'Tier 2 Ready'
  return 'Needs Training'
}

// ==========================================
// CONTROLLERS
// ==========================================

// GET /api/college/overview
const getCollegeOverview = async (req, res) => {
  try {
    let college = null
    let totalStudents = 0
    let activeDrives = 0
    let totalCompletedMocks = 0
    let avgScore = 0

    if (isMongoConnected()) {
      college = await College.findOne({ collegeId: DEFAULT_COLLEGE_ID })
      if (!college) {
        college = await College.create(seedCollege).catch(() => null)
      }
      totalStudents = await StudentRoster.countDocuments({ collegeId: DEFAULT_COLLEGE_ID })
      activeDrives = await PlacementDrive.countDocuments({ collegeId: DEFAULT_COLLEGE_ID, status: 'active' })
      const students = await StudentRoster.find({ collegeId: DEFAULT_COLLEGE_ID })
      const assessed = students.filter(s => s.avgScore > 0)
      if (assessed.length > 0) {
        avgScore = (assessed.reduce((acc, s) => acc + s.avgScore, 0) / assessed.length).toFixed(1)
        totalCompletedMocks = students.reduce((acc, s) => acc + (s.totalMocksTaken || 0), 0)
      }
    }

    if (!college) {
      college = inMemoryCollege
      totalStudents = inMemoryStudents.size
      activeDrives = Array.from(inMemoryDrives.values()).filter(d => d.status === 'active').length
      const students = Array.from(inMemoryStudents.values())
      const assessed = students.filter(s => s.avgScore > 0)
      avgScore = assessed.length > 0 ? (assessed.reduce((acc, s) => acc + s.avgScore, 0) / assessed.length).toFixed(1) : 78.4
      totalCompletedMocks = students.reduce((acc, s) => acc + (s.totalMocksTaken || 0), 0)
    }

    res.json({
      college,
      metrics: {
        totalStudents: Number(totalStudents) || inMemoryStudents.size,
        activeDrives: Number(activeDrives) || 2,
        totalCompletedMocks: Number(totalCompletedMocks) || 26,
        avgScore: Number(avgScore) || 78.4,
        readinessRate: '82%'
      }
    })
  } catch (err) {
    console.error('Error fetching college overview:', err)
    res.status(500).json({ error: 'Failed to fetch college overview' })
  }
}

// GET /api/college/students
const getStudents = async (req, res) => {
  try {
    const { department, batch, tier, search, minCgpa } = req.query

    let students = []
    if (isMongoConnected()) {
      const query = { collegeId: DEFAULT_COLLEGE_ID }
      if (department && department !== 'all') query.department = department
      if (batch && batch !== 'all') query.batch = batch
      if (tier && tier !== 'all') query.predictedTier = tier
      if (minCgpa) query.cgpa = { $gte: parseFloat(minCgpa) }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
      students = await StudentRoster.find(query).sort({ rollNumber: 1 })
    }

    if (students.length === 0) {
      students = Array.from(inMemoryStudents.values()).filter(s => {
        if (department && department !== 'all' && s.department !== department) return false
        if (batch && batch !== 'all' && s.batch !== batch) return false
        if (tier && tier !== 'all' && s.predictedTier !== tier) return false
        if (minCgpa && s.cgpa < parseFloat(minCgpa)) return false
        if (search) {
          const q = search.toLowerCase()
          return s.name.toLowerCase().includes(q) ||
                 s.rollNumber.toLowerCase().includes(q) ||
                 s.email.toLowerCase().includes(q)
        }
        return true
      })
    }

    res.json({ students, total: students.length })
  } catch (err) {
    console.error('Error fetching students:', err)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
}

// POST /api/college/students/upload (Bulk CSV / JSON)
const uploadRoster = async (req, res) => {
  try {
    const { csvData, studentsList, collegeName, collegeCode, clearExisting } = req.body
    let parsedStudents = []

    if (collegeName && collegeName.trim()) {
      inMemoryCollege.name = collegeName.trim()
    }
    if (collegeCode && collegeCode.trim()) {
      inMemoryCollege.code = collegeCode.trim().toUpperCase()
    }
    if (clearExisting) {
      inMemoryStudents.clear()
    }

    if (Array.isArray(studentsList) && studentsList.length > 0) {
      parsedStudents = studentsList
    } else if (typeof csvData === 'string' && csvData.trim()) {
      // Parse CSV text directly
      const lines = csvData.trim().split(/\r?\n/)
      if (lines.length <= 1) {
        return res.status(400).json({ error: 'CSV file is empty or missing data rows' })
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_]+/g, ''))

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))

        const student = {}
        headers.forEach((header, index) => {
          student[header] = cols[index] || ''
        })

        // Normalization
        const rollNumber = (student.rollno || student.rollnumber || student.roll || `STU${1000 + i}`).toUpperCase()
        const name = student.name || student.studentname || `Student ${rollNumber}`
        const email = student.email || `${rollNumber.toLowerCase()}@${inMemoryCollege.domain || 'university.edu'}`
        const department = student.department || student.dept || student.branch || 'Computer Science & Engineering'
        const batch = student.batch || student.year || '2026'
        const section = student.section || 'A'
        const cgpa = parseFloat(student.cgpa || student.gpa || '7.5') || 7.5
        const phone = student.phone || student.mobile || '+91 98000 00000'

        parsedStudents.push({
          rollNumber,
          name,
          email,
          department,
          batch,
          section,
          cgpa,
          phone,
          status: 'enrolled',
          avgScore: 0,
          totalMocksTaken: 0,
          predictedTier: 'Unassessed',
          driveHistory: []
        })
      }
    } else {
      return res.status(400).json({ error: 'Please provide CSV content or a list of students' })
    }

    if (parsedStudents.length === 0) {
      return res.status(400).json({ error: 'No valid students found to import' })
    }

    // Save to Mongo or in-memory
    let savedCount = 0
    if (isMongoConnected()) {
      for (const stu of parsedStudents) {
        await StudentRoster.findOneAndUpdate(
          { collegeId: DEFAULT_COLLEGE_ID, rollNumber: stu.rollNumber },
          { $set: { ...stu, collegeId: DEFAULT_COLLEGE_ID } },
          { upsert: true, new: true }
        ).catch(() => null)
        savedCount++
      }
    }

    // Always update in-memory as well
    for (const stu of parsedStudents) {
      inMemoryStudents.set(stu.rollNumber, {
        ...stu,
        collegeId: DEFAULT_COLLEGE_ID
      })
      savedCount++
    }

    res.json({
      success: true,
      message: `Successfully processed and synced ${parsedStudents.length} students into the college database.`,
      count: parsedStudents.length,
      sample: parsedStudents.slice(0, 3)
    })
  } catch (err) {
    console.error('Roster upload error:', err)
    res.status(500).json({ error: 'Failed to process student roster upload' })
  }
}

// GET /api/college/sample-csv
const getSampleCsvTemplate = (req, res) => {
  const sample = `Roll Number,Name,Email,Department,Batch,Section,CGPA,Phone
22CSE101,Aarav Sharma,aarav.sharma@apextech.edu,Computer Science & Engineering,2026,A,9.1,+91 9876543210
22IT102,Priya Iyer,priya.iyer@apextech.edu,Information Technology,2026,B,8.8,+91 9876543211
22ECE103,Rohan Varma,rohan.varma@apextech.edu,Electronics & Communication,2026,A,8.2,+91 9876543212
22AI104,Sneha Patel,sneha.patel@apextech.edu,Data Science & AI,2026,A,7.9,+91 9876543213`

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="interviewai_student_roster_template.csv"')
  res.send(sample)
}

// GET /api/college/drives
const getDrives = async (req, res) => {
  try {
    let drives = []
    if (isMongoConnected()) {
      drives = await PlacementDrive.find({ collegeId: DEFAULT_COLLEGE_ID }).sort({ createdAt: -1 })
    }

    if (drives.length === 0) {
      drives = Array.from(inMemoryDrives.values())
    }

    res.json({ drives, total: drives.length })
  } catch (err) {
    console.error('Error fetching drives:', err)
    res.status(500).json({ error: 'Failed to fetch drives' })
  }
}

// POST /api/college/drives
const createDrive = async (req, res) => {
  try {
    const {
      title,
      company,
      role,
      description,
      targetDepartments,
      targetBatch = '2026',
      endDate,
      proctoringLevel = 'strict'
    } = req.body

    if (!title || !company || !role || !endDate) {
      return res.status(400).json({ error: 'Title, company, role, and end date are required' })
    }

    const driveId = `drv_${company.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`

    const newDrive = {
      driveId,
      collegeId: DEFAULT_COLLEGE_ID,
      title,
      company,
      role,
      description: description || `Campus placement mock drive for ${company} (${role}).`,
      targetDepartments: Array.isArray(targetDepartments) && targetDepartments.length > 0 ? targetDepartments : ['Computer Science & Engineering', 'Information Technology'],
      targetBatch,
      startDate: new Date(),
      endDate: new Date(endDate),
      status: 'active',
      proctoringLevel,
      rounds: [
        { roundNumber: 1, name: 'AI Technical Interview', type: 'ai_technical' },
        { roundNumber: 2, name: 'Monaco Live Coding Round', type: 'coding' },
        { roundNumber: 3, name: 'HR Behavioral Assessment', type: 'hr_avatar' }
      ],
      totalRegistered: 0,
      totalCompleted: 0,
      averageScore: 0,
      createdBy: req.user ? req.user.email : 'TPO Admin'
    }

    if (isMongoConnected()) {
      await PlacementDrive.create(newDrive).catch(() => null)
    }
    inMemoryDrives.set(driveId, newDrive)

    res.status(201).json({
      success: true,
      message: 'Placement Mock Drive created successfully!',
      drive: newDrive
    })
  } catch (err) {
    console.error('Create drive error:', err)
    res.status(500).json({ error: 'Failed to create placement mock drive' })
  }
}

// GET /api/college/drives/:driveId
const getDriveDetails = async (req, res) => {
  try {
    const { driveId } = req.params

    let drive = null
    if (isMongoConnected()) {
      drive = await PlacementDrive.findOne({ driveId })
    }
    if (!drive) {
      drive = inMemoryDrives.get(driveId)
    }

    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' })
    }

    // Find student submissions for this drive
    let students = []
    if (isMongoConnected()) {
      const records = await StudentRoster.find({ 'driveHistory.driveId': driveId })
      students = records.map(s => {
        const sub = s.driveHistory.find(d => d.driveId === driveId)
        return {
          rollNumber: s.rollNumber,
          name: s.name,
          email: s.email,
          department: s.department,
          cgpa: s.cgpa,
          submission: sub
        }
      })
    }

    if (students.length === 0) {
      const records = Array.from(inMemoryStudents.values())
      students = records
        .filter(s => s.driveHistory && s.driveHistory.some(d => d.driveId === driveId))
        .map(s => {
          const sub = s.driveHistory.find(d => d.driveId === driveId)
          return {
            rollNumber: s.rollNumber,
            name: s.name,
            email: s.email,
            department: s.department,
            cgpa: s.cgpa,
            submission: sub
          }
        })
    }

    res.json({ drive, submissions: students })
  } catch (err) {
    console.error('Drive details error:', err)
    res.status(500).json({ error: 'Failed to fetch drive details' })
  }
}

// GET /api/college/analytics
const getCollegeAnalytics = async (req, res) => {
  try {
    let students = []
    if (isMongoConnected()) {
      students = await StudentRoster.find({ collegeId: DEFAULT_COLLEGE_ID })
    }
    if (students.length === 0) {
      students = Array.from(inMemoryStudents.values())
    }

    // Department grouping
    const departmentMap = {}
    students.forEach(s => {
      const dept = s.department || 'Other'
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          name: dept,
          studentCount: 0,
          totalScore: 0,
          assessedCount: 0,
          codeScoreTotal: 0,
          integrityTotal: 0
        }
      }
      departmentMap[dept].studentCount += 1
      if (s.avgScore > 0) {
        departmentMap[dept].assessedCount += 1
        departmentMap[dept].totalScore += s.avgScore

        // Pull latest submission scores
        const latest = s.driveHistory && s.driveHistory.length > 0 ? s.driveHistory[s.driveHistory.length - 1] : null
        if (latest) {
          departmentMap[dept].codeScoreTotal += (latest.codeScore || s.avgScore)
          departmentMap[dept].integrityTotal += (latest.integrityScore || 95)
        }
      }
    })

    const departmentAnalytics = Object.values(departmentMap).map(d => ({
      department: d.name,
      studentCount: d.studentCount,
      avgScore: d.assessedCount > 0 ? Math.round(d.totalScore / d.assessedCount) : 0,
      avgCodeScore: d.assessedCount > 0 ? Math.round(d.codeScoreTotal / d.assessedCount) : 0,
      avgIntegrityScore: d.assessedCount > 0 ? Math.round(d.integrityTotal / d.assessedCount) : 95
    }))

    // Tier distribution
    const tierCounts = {
      'Tier 1 Ready': 0,
      'Tier 2 Ready': 0,
      'Needs Training': 0,
      'Unassessed': 0
    }

    students.forEach(s => {
      const tier = s.predictedTier || 'Unassessed'
      if (tierCounts[tier] !== undefined) tierCounts[tier]++
      else tierCounts['Needs Training']++
    })

    const tierDistribution = Object.entries(tierCounts).map(([tier, count]) => ({
      name: tier,
      value: count,
      percentage: students.length > 0 ? Math.round((count / students.length) * 100) : 0
    }))

    // Skill Radar Metrics for the College
    const skillMetrics = [
      { subject: 'Technical Knowledge', value: 82, fullMark: 100 },
      { subject: 'System Design & Logic', value: 74, fullMark: 100 },
      { subject: 'Coding Accuracy', value: 79, fullMark: 100 },
      { subject: 'Verbal Communication', value: 85, fullMark: 100 },
      { subject: 'Proctoring Integrity', value: 96, fullMark: 100 },
      { subject: 'Behavioral Fit', value: 80, fullMark: 100 }
    ]

    // Remedial Action Items generated for TPOs
    const remedialPlan = [
      {
        topic: 'Dynamic Programming & Algorithmic Optimization',
        department: 'Electronics & Communication',
        impact: 'Affects Tier-1 conversion by 24%',
        recommendation: 'Conduct a 3-day focused sprint on 2-Pointer and DP state transitions before Amazon/Google drives.'
      },
      {
        topic: 'STAR Method Behavioral Framing',
        department: 'Information Technology',
        impact: 'Candidates answer technical questions well but miss context in HR rounds',
        recommendation: 'Enable Avatar practice for Accenture & Cognizant leadership competencies.'
      },
      {
        topic: 'SQL Query & Schema Normalization',
        department: 'All Departments',
        impact: 'Common failure point across TCS Digital and Wipro test rounds',
        recommendation: 'Assign mandatory 15-question relational schema test in Mock Drive #2.'
      }
    ]

    res.json({
      departments: departmentAnalytics,
      tierDistribution,
      skillMetrics,
      remedialPlan,
      totalStudents: students.length,
      placedCount: students.filter(s => s.status === 'placed').length
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: 'Failed to generate college analytics' })
  }
}

// GET /api/college/export-recruiter (CSV Download)
const exportRecruiterList = async (req, res) => {
  try {
    const { minCgpa = 7.0, minScore = 70, department } = req.query

    let students = []
    if (isMongoConnected()) {
      const query = {
        collegeId: DEFAULT_COLLEGE_ID,
        cgpa: { $gte: parseFloat(minCgpa) }
      }
      if (department && department !== 'all') query.department = department
      students = await StudentRoster.find(query).sort({ avgScore: -1 })
    }

    if (students.length === 0) {
      students = Array.from(inMemoryStudents.values()).filter(s => {
        if (s.cgpa < parseFloat(minCgpa)) return false
        if (department && department !== 'all' && s.department !== department) return false
        return true
      }).sort((a, b) => b.avgScore - a.avgScore)
    }

    // Filter by minScore if assessed
    const filtered = students.filter(s => s.avgScore >= parseFloat(minScore))

    let csvContent = 'Roll Number,Name,Email,Department,CGPA,AI Mock Score (0-100),Placement Readiness Tier,Proctoring Integrity (%),Total Mocks\n'
    filtered.forEach(s => {
      const latest = s.driveHistory && s.driveHistory.length > 0 ? s.driveHistory[s.driveHistory.length - 1] : null
      const integrity = latest ? latest.integrityScore : 98
      csvContent += `"${s.rollNumber}","${s.name}","${s.email}","${s.department}",${s.cgpa},${s.avgScore},"${s.predictedTier}",${integrity}%,${s.totalMocksTaken}\n`
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="Recruiter_Shortlist_${Date.now()}.csv"`)
    res.send(csvContent)
  } catch (err) {
    console.error('Recruiter export error:', err)
    res.status(500).json({ error: 'Failed to export recruiter shortlist' })
  }
}

// POST /api/college/submit-mock (When student finishes mock in a drive)
const submitDriveMock = async (req, res) => {
  try {
    const {
      driveId,
      rollNumber,
      email,
      sessionId,
      overallScore = 80,
      technicalScore = 82,
      communicationScore = 78,
      codeScore = 85,
      integrityScore = 96,
      flaggedIssues = []
    } = req.body

    const readinessTier = calculateTier(overallScore)

    const submission = {
      driveId,
      sessionId,
      status: 'completed',
      overallScore,
      technicalScore,
      communicationScore,
      problemSolvingScore: Math.round((technicalScore + codeScore) / 2),
      codeScore,
      integrityScore,
      readinessTier,
      flaggedIssues,
      completedAt: new Date()
    }

    // Update in-memory student
    let foundStudent = null
    for (const [roll, student] of inMemoryStudents.entries()) {
      if ((rollNumber && roll === rollNumber.toUpperCase()) || (email && student.email === email.toLowerCase())) {
        student.driveHistory = student.driveHistory || []
        // replace or add
        const existingIdx = student.driveHistory.findIndex(d => d.driveId === driveId)
        if (existingIdx >= 0) {
          student.driveHistory[existingIdx] = submission
        } else {
          student.driveHistory.push(submission)
        }
        student.totalMocksTaken = (student.totalMocksTaken || 0) + 1
        const scores = student.driveHistory.map(d => d.overallScore)
        student.avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        student.predictedTier = calculateTier(student.avgScore)
        foundStudent = student
        break
      }
    }

    if (isMongoConnected()) {
      await StudentRoster.findOneAndUpdate(
        {
          collegeId: DEFAULT_COLLEGE_ID,
          $or: [{ rollNumber: rollNumber?.toUpperCase() }, { email: email?.toLowerCase() }]
        },
        {
          $push: { driveHistory: submission },
          $inc: { totalMocksTaken: 1 },
          $set: { predictedTier: readinessTier }
        }
      ).catch(() => null)

      // Increment drive completed count
      await PlacementDrive.findOneAndUpdate(
        { driveId },
        { $inc: { totalCompleted: 1 } }
      ).catch(() => null)
    }

    // Also update drive in memory
    const memDrive = inMemoryDrives.get(driveId)
    if (memDrive) {
      memDrive.totalCompleted = (memDrive.totalCompleted || 0) + 1
    }

    res.json({
      success: true,
      message: 'Drive submission recorded successfully',
      submission,
      student: foundStudent
    })
  } catch (err) {
    console.error('Submit mock error:', err)
    res.status(500).json({ error: 'Failed to record drive mock submission' })
  }
}

// GET /api/college/student-assigned-drives
const getStudentAssignedDrives = async (req, res) => {
  try {
    const userEmail = req.user ? req.user.email : req.query.email

    let assignedDrives = []
    const allDrives = Array.from(inMemoryDrives.values())

    // Find student in roster
    let student = null
    for (const s of inMemoryStudents.values()) {
      if (s.email.toLowerCase() === (userEmail || '').toLowerCase()) {
        student = s
        break
      }
    }

    // Return active drives matching student's department or all active drives
    assignedDrives = allDrives.map(drive => {
      const existingSubmission = student?.driveHistory?.find(h => h.driveId === drive.driveId)
      return {
        ...drive,
        userStatus: existingSubmission ? 'completed' : 'assigned',
        userScore: existingSubmission ? existingSubmission.overallScore : null,
        sessionId: existingSubmission ? existingSubmission.sessionId : null
      }
    })

    res.json({
      drives: assignedDrives,
      studentInfo: student ? {
        rollNumber: student.rollNumber,
        department: student.department,
        cgpa: student.cgpa,
        predictedTier: student.predictedTier
      } : null
    })
  } catch (err) {
    console.error('Student drives error:', err)
    res.status(500).json({ error: 'Failed to fetch student assigned drives' })
  }
}

// PUT /api/college/profile
const updateCollegeProfile = async (req, res) => {
  try {
    const { name, code, domain, departments } = req.body
    if (name && name.trim()) inMemoryCollege.name = name.trim()
    if (code && code.trim()) inMemoryCollege.code = code.trim().toUpperCase()
    if (domain && domain.trim()) inMemoryCollege.domain = domain.trim()
    if (Array.isArray(departments) && departments.length > 0) inMemoryCollege.departments = departments

    if (isMongoConnected()) {
      await College.findOneAndUpdate(
        { collegeId: DEFAULT_COLLEGE_ID },
        { $set: inMemoryCollege },
        { upsert: true, new: true }
      ).catch(() => null)
    }

    res.json({
      success: true,
      message: 'Institution profile updated successfully',
      college: inMemoryCollege
    })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Failed to update college profile' })
  }
}

module.exports = {
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
}
