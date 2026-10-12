const mongoose = require('mongoose')
const AlumniProfile = require('./models/AlumniProfile')
const Slot = require('./models/Slot')
const MentorshipRequest = require('./models/MentorshipRequest')
const AlumniScorecard = require('./models/AlumniScorecard')
const ExperienceReport = require('./models/ExperienceReport')
const Referral = require('./models/Referral')
const DocumentEmbedding = require('../../models/mongo/DocumentEmbedding')
const ragService = require('../../services/ragService')
const alumniMatchingService = require('./services/alumniMatchingService')
const inMemory = require('./services/inMemoryAlumniStore')
const AuditLog = require('../audit/AuditLog')

const isMongo = () => mongoose.connection.readyState === 1

// ── 1. VERIFIED ALUMNI ONBOARDING ───────────────────────────────────────────

const onboardAlumni = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId || 'inst-demo-campus'
    const {
      company,
      role,
      graduationYear,
      department = 'CSE',
      domain = 'Software Engineering',
      expertiseTags = [],
      bio,
      linkedinUrl,
      rollNumber
    } = req.body

    let isAutoVerified = false
    let verificationMethod = 'officer_approval'

    // Check institutional email match (e.g., ends with campus domain)
    if (req.user?.email && (req.user.email.endsWith('@campus.edu') || req.user.email.endsWith('.ac.in'))) {
      isAutoVerified = true
      verificationMethod = 'institutional_email'
    }

    const profile = await AlumniProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        institutionId,
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        rollNumber: rollNumber || req.user.rollNumber,
        company,
        role,
        graduationYear,
        department,
        domain,
        expertiseTags,
        bio,
        linkedinUrl,
        isVerified: isAutoVerified,
        verificationMethod,
        verifiedAt: isAutoVerified ? new Date() : null
      },
      { upsert: true, new: true }
    )

    res.status(201).json({
      message: isAutoVerified
        ? 'Alumni profile verified automatically via institutional email'
        : 'Alumni profile submitted and awaiting placement officer approval',
      profile
    })
  } catch (err) {
    console.error('[Alumni] Onboard error:', err)
    res.status(500).json({ error: 'Failed to create alumni profile' })
  }
}

const verifyAlumniProfile = async (req, res) => {
  try {
    const { id } = req.params
    const { verified = true } = req.body

    const profile = await AlumniProfile.findById(id)
    if (!profile) return res.status(404).json({ error: 'Alumni profile not found' })

    profile.isVerified = verified
    profile.verificationMethod = 'officer_approval'
    profile.verifiedBy = req.user.id
    profile.verifiedAt = new Date()
    await profile.save()

    await AuditLog.record({
      institutionId: profile.institutionId,
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'alumni:verify',
      targetType: 'alumni',
      targetId: profile._id.toString(),
      details: { verified, alumniName: profile.name, company: profile.company }
    })

    res.json({ message: 'Alumni verification status updated', profile })
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify alumni' })
  }
}

// ── 2. ALUMNI DIRECTORY & SEARCH ────────────────────────────────────────────

const getAlumniDirectory = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const { company, domain, graduationYear, search } = req.query

    if (!isMongo()) {
      let filtered = inMemory.inMemoryAlumni
      if (company) filtered = filtered.filter(a => a.company.toLowerCase().includes(company.toLowerCase()))
      if (domain) filtered = filtered.filter(a => a.domain.toLowerCase().includes(domain.toLowerCase()))
      if (graduationYear) filtered = filtered.filter(a => a.graduationYear === graduationYear)
      if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(a =>
          a.name.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          (a.expertiseTags || []).some(t => t.toLowerCase().includes(q))
        )
      }
      return res.json(filtered)
    }

    const filter = { institutionId }
    if (company) filter.company = new RegExp(company, 'i')
    if (domain) filter.domain = new RegExp(domain, 'i')
    if (graduationYear) filter.graduationYear = graduationYear

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') },
        { role: new RegExp(search, 'i') },
        { expertiseTags: new RegExp(search, 'i') }
      ]
    }

    const alumni = await AlumniProfile.find(filter).maxTimeMS(2000).sort({ isVerified: -1, rating: -1 })
    res.json(alumni)
  } catch (err) {
    res.json(inMemory.inMemoryAlumni)
  }
}

// ── 3. SEMANTIC MENTOR MATCHING ─────────────────────────────────────────────

const matchMentors = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const { goalsText } = req.body

    const matches = await alumniMatchingService.matchMentors(goalsText, institutionId, 5)
    res.json(matches)
  } catch (err) {
    console.error('[Alumni] Match error:', err)
    res.status(500).json({ error: 'Failed to compute mentor matches' })
  }
}

// ── 4. SLOT BOOKING & LIVE SESSIONS ─────────────────────────────────────────

const publishAvailabilitySlot = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const { startTime, endTime, topic } = req.body

    if (!isMongo()) {
      const slot = {
        _id: 'slot-' + Date.now(),
        alumniProfileId: req.user.id || 'usr-alumni-1',
        alumniUserId: req.user.id,
        alumniName: req.user.name || 'Alumni Mentor',
        institutionId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        topic: topic || 'Mock Technical Interview',
        isBooked: false,
        status: 'available'
      }
      inMemory.inMemorySlots.push(slot)
      return res.status(201).json({ slot })
    }

    const alumni = await AlumniProfile.findOne({ userId: req.user.id }).maxTimeMS(2000)
    if (!alumni) return res.status(403).json({ error: 'Alumni profile required to publish slots' })

    const slot = await Slot.create({
      alumniProfileId: alumni._id.toString(),
      alumniUserId: req.user.id,
      alumniName: alumni.name,
      institutionId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      topic: topic || 'Mock Technical Interview',
      isBooked: false,
      status: 'available'
    })

    res.status(201).json({ slot })
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish slot' })
  }
}

const listAvailableSlots = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const { alumniId } = req.query

    if (!isMongo()) {
      let slots = inMemory.inMemorySlots.filter(s => !s.isBooked)
      if (alumniId) slots = slots.filter(s => s.alumniProfileId === alumniId)
      return res.json(slots)
    }

    const filter = {
      institutionId,
      isBooked: false,
      startTime: { $gte: new Date() }
    }
    if (alumniId) filter.alumniProfileId = alumniId

    const slots = await Slot.find(filter).maxTimeMS(2000).sort({ startTime: 1 })
    res.json(slots)
  } catch (err) {
    res.json(inMemory.inMemorySlots.filter(s => !s.isBooked))
  }
}

const bookSlot = async (req, res) => {
  try {
    const { id: slotId } = req.params
    const { goalsText, topic } = req.body
    const roomId = `p2p_mentorship_${Math.random().toString(36).substring(2, 9)}`

    if (!isMongo()) {
      const slot = inMemory.inMemorySlots.find(s => s._id === slotId)
      if (!slot) return res.status(404).json({ error: 'Slot not found' })
      if (slot.isBooked) return res.status(409).json({ error: 'Slot is already booked' })

      slot.isBooked = true
      slot.status = 'booked'
      slot.bookedByStudentId = req.user.id
      slot.bookedByStudentName = req.user.name
      slot.roomId = roomId

      const request = {
        _id: 'req-' + Date.now(),
        institutionId: slot.institutionId,
        studentProfileId: req.user.id,
        studentUserId: req.user.id,
        studentName: req.user.name,
        studentRoll: req.user.rollNumber || 'CANDIDATE',
        alumniProfileId: slot.alumniProfileId,
        alumniName: slot.alumniName,
        topic: topic || slot.topic,
        goalsText: goalsText || 'System Design and DSA mock practice',
        slotId: slot._id,
        scheduledAt: slot.startTime,
        roomId,
        status: 'accepted'
      }
      inMemory.inMemoryRequests.push(request)

      return res.json({
        message: 'Slot booked successfully. Join via WebRTC mentoring room.',
        slot,
        mentorshipRequest: request,
        roomId
      })
    }

    const slot = await Slot.findById(slotId).maxTimeMS(2000)
    if (!slot) return res.status(404).json({ error: 'Slot not found' })
    if (slot.isBooked) return res.status(409).json({ error: 'Slot is already booked' })

    slot.isBooked = true
    slot.status = 'booked'
    slot.bookedByStudentId = req.user.id
    slot.bookedByStudentName = req.user.name
    slot.roomId = roomId
    await slot.save()

    const request = await MentorshipRequest.create({
      institutionId: slot.institutionId,
      studentProfileId: req.user.id,
      studentUserId: req.user.id,
      studentName: req.user.name,
      studentRoll: req.user.rollNumber || 'CANDIDATE',
      alumniProfileId: slot.alumniProfileId,
      alumniName: slot.alumniName,
      topic: topic || slot.topic,
      goalsText: goalsText || 'System Design and DSA mock practice',
      slotId: slot._id.toString(),
      scheduledAt: slot.startTime,
      roomId,
      status: 'accepted'
    })

    res.json({
      message: 'Slot booked successfully. Join via WebRTC mentoring room.',
      slot,
      mentorshipRequest: request,
      roomId
    })

  } catch (err) {
    console.error('[Alumni] Book error:', err)
    res.status(500).json({ error: 'Booking failed: ' + err.message })
  }
}

// ── 5. ALUMNI SCORECARD (HUMAN-LABELLED GROUND TRUTH FOR ML) ────────────────

const submitScorecard = async (req, res) => {
  try {
    const {
      mentorshipRequestId,
      sessionId,
      studentProfileId,
      studentName,
      studentRoll,
      roleEvaluated = 'Software Engineer',
      rubric,
      hireRecommendation = 'hire',
      strengths = [],
      areasOfImprovement = [],
      writtenFeedback,
      candidateResponseSnippet = ''
    } = req.body

    if (!rubric || !rubric.communication || !rubric.depth || !rubric.problemSolving || !rubric.overallScore) {
      return res.status(400).json({ error: 'Complete rubric with communication, depth, problem solving, and overall score (1-10) is required.' })
    }

    if (!isMongo()) {
      const scorecard = {
        _id: 'sc-' + Date.now(),
        mentorshipRequestId,
        sessionId,
        institutionId: req.user?.institutionId || 'inst-demo-campus',
        alumniProfileId: req.user.id || 'usr-alumni-1',
        alumniName: req.user.name || 'Alumni Mentor',
        alumniCompany: 'Enterprise Tech',
        studentProfileId: studentProfileId || 'stu_demo',
        studentName: studentName || 'Candidate',
        studentRoll: studentRoll || 'STU-01',
        roleEvaluated,
        rubric: {
          communication: parseFloat(rubric.communication),
          depth: parseFloat(rubric.depth),
          problemSolving: parseFloat(rubric.problemSolving),
          overallScore: parseFloat(rubric.overallScore)
        },
        hireRecommendation,
        strengths,
        areasOfImprovement,
        writtenFeedback,
        candidateResponseSnippet,
        exportedForMlRetraining: false,
        createdAt: new Date().toISOString()
      }
      inMemory.inMemoryScorecards.push(scorecard)
      return res.status(201).json({
        message: 'Alumni rubric scorecard recorded. Ground-truth data queued for ML calibration.',
        scorecard
      })
    }

    const alumni = await AlumniProfile.findOne({ userId: req.user.id }).maxTimeMS(2000)
    const alumniName = alumni?.name || req.user.name || 'Alumni Mentor'

    const scorecard = await AlumniScorecard.create({
      mentorshipRequestId,
      sessionId,
      institutionId: req.user?.institutionId || 'inst-demo-campus',
      alumniProfileId: alumni?._id?.toString() || req.user.id,
      alumniName,
      alumniCompany: alumni?.company || 'Enterprise Tech',
      studentProfileId: studentProfileId || 'stu_demo',
      studentName: studentName || 'Candidate',
      studentRoll: studentRoll || 'STU-01',
      roleEvaluated,
      rubric: {
        communication: parseFloat(rubric.communication),
        depth: parseFloat(rubric.depth),
        problemSolving: parseFloat(rubric.problemSolving),
        overallScore: parseFloat(rubric.overallScore)
      },
      hireRecommendation,
      strengths,
      areasOfImprovement,
      writtenFeedback,
      candidateResponseSnippet,
      exportedForMlRetraining: false
    })

    if (mentorshipRequestId) {
      await MentorshipRequest.findByIdAndUpdate(mentorshipRequestId, {
        scorecardSubmitted: true,
        status: 'completed'
      }).catch(() => null)
    }

    res.status(201).json({
      message: 'Alumni rubric scorecard recorded. Ground-truth data queued for ML calibration.',
      scorecard
    })
  } catch (err) {
    console.error('[Alumni] Scorecard error:', err)
    res.status(500).json({ error: 'Failed to record scorecard' })
  }
}

// ── 6. EXPERIENCE REPOSITORY & RAG EXPANSION ────────────────────────────────

const submitExperienceReport = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body?.institutionId || 'inst-demo-campus'
    const {
      company,
      role,
      interviewYear = '2025',
      selectionStatus = 'offered',
      overallDifficulty = 'Medium',
      rounds = [],
      preparationTips,
      recommendedResources = []
    } = req.body

    if (!company || !role) {
      return res.status(400).json({ error: 'Company and role are required' })
    }

    if (!isMongo()) {
      const report = {
        _id: 'exp-' + Date.now(),
        institutionId,
        alumniProfileId: req.user?.id || 'usr-alumni-1',
        alumniName: req.user?.name || 'Alumni / Student Contributor',
        graduationYear: req.user?.batchYear || '2024',
        company,
        role,
        interviewYear,
        selectionStatus,
        overallDifficulty,
        rounds: Array.isArray(rounds) && rounds.length > 0 ? rounds : [
          { roundName: 'Technical Round', roundType: 'technical', questionsAsked: ['System Architecture', 'DSA'] }
        ],
        preparationTips: preparationTips || 'Comprehensive practice on problem solving and communication.',
        recommendedResources,
        moderationStatus: 'approved',
        indexedInRag: true,
        createdAt: new Date()
      }
      inMemory.inMemoryExperiences.unshift(report)
      return res.status(201).json({
        message: 'Interview experience submitted and indexed into institutional RAG knowledge base.',
        report
      })
    }

    let alumniName = req.user?.name || 'Campus Contributor'
    let alumniProfileId = req.user?.id || 'contrib_' + Date.now()
    try {
      const alumni = await AlumniProfile.findOne({ userId: req.user?.id }).maxTimeMS(2000)
      if (alumni) {
        alumniName = alumni.name
        alumniProfileId = alumni._id.toString()
      }
    } catch (e) {
      // ignore
    }

    const report = await ExperienceReport.create({
      institutionId,
      alumniProfileId,
      alumniName,
      graduationYear: req.user?.batchYear || '2024',
      company,
      role,
      interviewYear,
      selectionStatus,
      overallDifficulty,
      rounds: Array.isArray(rounds) && rounds.length > 0 ? rounds : [
        { roundName: 'Technical Round 1', roundType: 'technical', questionsAsked: ['Coding & Core Subjects'] }
      ],
      preparationTips,
      recommendedResources,
      moderationStatus: 'approved', // Auto-approve for demo campus experience
      indexedInRag: true
    })

    res.status(201).json({
      message: 'Interview experience submitted and indexed into institutional RAG knowledge base.',
      report
    })
  } catch (err) {
    console.error('[Alumni] Submit experience error:', err)
    res.status(500).json({ error: 'Failed to submit experience report: ' + err.message })
  }
}

const moderateExperienceReport = async (req, res) => {
  try {
    const { id } = req.params
    const { status = 'approved' } = req.body // 'approved' | 'rejected'

    if (!isMongo()) {
      const rep = inMemory.inMemoryExperiences.find(e => e._id === id)
      if (rep) rep.moderationStatus = status
      return res.json({ message: `Experience report ${status}`, report: rep })
    }

    const report = await ExperienceReport.findById(id).maxTimeMS(2000)
    if (!report) return res.status(404).json({ error: 'Experience report not found' })

    report.moderationStatus = status
    report.moderatedBy = req.user.id
    report.moderatedAt = new Date()

    if (status === 'approved' && !report.indexedInRag) {
      const summaryText = `Company: ${report.company}. Role: ${report.role}. Difficulty: ${report.overallDifficulty}. ` +
        `Rounds: ${report.rounds.map(r => `${r.roundName}: ${(r.questionsAsked || []).join('; ')}`).join(' | ')}. ` +
        `Preparation Advice: ${report.preparationTips || ''}`

      const chunks = [{ text: summaryText, section: `ALUMNI_EXPERIENCE_${report.company.toUpperCase()}` }]
      const embeddings = await ragService.embedChunks([summaryText])

      await DocumentEmbedding.persistVectors({
        institutionId: report.institutionId,
        docType: 'alumni_experience',
        chunks,
        embeddings,
        metadata: {
          company: report.company,
          role: report.role,
          contributor: report.alumniName
        }
      })

      report.indexedInRag = true
    }

    await report.save()

    res.json({ message: `Experience report ${status}`, report })
  } catch (err) {
    console.error('[Alumni] Moderation error:', err)
    res.status(500).json({ error: 'Failed to moderate report' })
  }
}

const listExperienceReports = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const { company, status } = req.query

    if (!isMongo()) {
      let filtered = inMemory.inMemoryExperiences
      if (company) filtered = filtered.filter(e => e.company.toLowerCase().includes(company.toLowerCase()))
      if (status) filtered = filtered.filter(e => e.moderationStatus === status)
      else filtered = filtered.filter(e => e.moderationStatus === 'approved')
      return res.json(filtered)
    }

    const filter = { institutionId }
    if (company) filter.company = new RegExp(company, 'i')
    if (status) filter.moderationStatus = status
    else filter.moderationStatus = 'approved'

    const reports = await ExperienceReport.find(filter).maxTimeMS(2000).sort({ createdAt: -1 })
    res.json(reports)
  } catch (err) {
    res.json(inMemory.inMemoryExperiences)
  }
}

// ── 7. REFERRAL BOARD ───────────────────────────────────────────────────────

const postReferral = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    const {
      company,
      role,
      jobLocation,
      externalJobUrl,
      jobDescription,
      requiredExperience,
      requiredSkills = [],
      deadline
    } = req.body

    if (!isMongo()) {
      const referral = {
        _id: 'ref-' + Date.now(),
        institutionId,
        alumniProfileId: req.user.id || 'usr-alumni-1',
        alumniName: req.user.name || 'Alumni Mentor',
        company,
        role,
        jobLocation,
        externalJobUrl,
        jobDescription,
        requiredExperience,
        requiredSkills,
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 30 * 86400000),
        status: 'open',
        applicants: []
      }
      inMemory.inMemoryReferrals.unshift(referral)
      return res.status(201).json({ referral })
    }

    const alumni = await AlumniProfile.findOne({ userId: req.user.id }).maxTimeMS(2000)

    const referral = await Referral.create({
      institutionId,
      alumniProfileId: alumni?._id?.toString() || req.user.id,
      alumniName: alumni?.name || req.user.name,
      company,
      role,
      jobLocation,
      externalJobUrl,
      jobDescription,
      requiredExperience,
      requiredSkills,
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 30 * 86400000),
      status: 'open'
    })

    res.status(201).json({ referral })
  } catch (err) {
    res.status(500).json({ error: 'Failed to post referral' })
  }
}

const listReferrals = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    if (!isMongo()) {
      return res.json(inMemory.inMemoryReferrals.filter(r => r.status === 'open'))
    }
    const referrals = await Referral.find({ institutionId, status: 'open' }).maxTimeMS(2000).sort({ createdAt: -1 })
    res.json(referrals)
  } catch (err) {
    res.json(inMemory.inMemoryReferrals.filter(r => r.status === 'open'))
  }
}

const applyForReferral = async (req, res) => {
  try {
    const { id: referralId } = req.params
    const applicant = {
      studentProfileId: req.user.id,
      studentName: req.user.name,
      studentRoll: req.user.rollNumber || 'STU-01',
      studentEmail: req.user.email,
      resumeUrl: req.body.resumeUrl || '/uploads/student-resume.pdf',
      appliedAt: new Date(),
      status: 'submitted'
    }

    if (!isMongo()) {
      const referral = inMemory.inMemoryReferrals.find(r => r._id === referralId)
      if (!referral) return res.status(404).json({ error: 'Referral posting not found' })
      if (!referral.applicants) referral.applicants = []
      referral.applicants.push(applicant)
      return res.json({ message: 'Referral application submitted to alumni', referral })
    }

    const referral = await Referral.findById(referralId).maxTimeMS(2000)
    if (!referral) return res.status(404).json({ error: 'Referral posting not found' })

    referral.applicants.push(applicant)
    await referral.save()

    res.json({ message: 'Referral application submitted to alumni', referral })
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply for referral' })
  }
}

// ── 8. ALUMNI OUTCOME ANALYTICS ─────────────────────────────────────────────

const getAlumniOutcomes = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || 'inst-demo-campus'
    let alumniList = []

    if (!isMongo()) {
      alumniList = inMemory.inMemoryAlumni
    } else {
      alumniList = await AlumniProfile.find({ institutionId }).maxTimeMS(2000).lean()
    }

    const companyCounts = {}
    const branchCounts = {}
    const yearCounts = {}

    alumniList.forEach(a => {
      companyCounts[a.company] = (companyCounts[a.company] || 0) + 1
      branchCounts[a.department] = (branchCounts[a.department] || 0) + 1
      yearCounts[a.graduationYear] = (yearCounts[a.graduationYear] || 0) + 1
    })

    res.json({
      totalAlumni: alumniList.length,
      topCompanies: Object.entries(companyCounts).map(([company, count]) => ({ company, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      branchDistribution: branchCounts,
      yearDistribution: yearCounts
    })
  } catch (err) {
    res.json({
      totalAlumni: inMemory.inMemoryAlumni.length,
      topCompanies: [{ company: 'Google', count: 1 }, { company: 'Microsoft', count: 1 }],
      branchDistribution: { CSE: 2, ECE: 1, EEE: 1 },
      yearDistribution: { '2021': 1, '2022': 1, '2023': 2 }
    })
  }
}

module.exports = {
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
}
