import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'

export default function AlumniNetwork() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('match') // 'match' | 'directory' | 'slots' | 'experiences' | 'referrals' | 'scorecard'
  const [loading, setLoading] = useState(false)

  // Data states
  const [directory, setDirectory] = useState([])
  const [slots, setSlots] = useState([])
  const [experiences, setExperiences] = useState([])
  const [referrals, setReferrals] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('All')

  // AI Matching state
  const [goalsText, setGoalsText] = useState('')
  const [matchResults, setMatchResults] = useState([])
  const [matchingLoading, setMatchingLoading] = useState(false)

  // Modals / forms
  const [bookingSlot, setBookingSlot] = useState(null)
  const [bookingGoals, setBookingGoals] = useState('')
  const [showExpModal, setShowExpModal] = useState(false)
  const [newExp, setNewExp] = useState({
    company: 'Google',
    role: 'Software Development Engineer',
    overallDifficulty: 'Hard',
    round1Name: 'Round 1: Algorithmic & Data Structures',
    round1Questions: 'Design LRU Cache, Binary Tree Maximum Path Sum',
    round2Name: 'Round 2: System Design & Scalability',
    round2Questions: 'Design scalable rate limiter with Redis and sliding window',
    preparationTips: 'Study Striver SDE sheet and NeetCode 150 thoroughly.'
  })

  // Mentor Scorecard state
  const [scorecardForm, setScorecardForm] = useState({
    studentName: 'Aarav Patel',
    studentRoll: '2026CSE01',
    roleEvaluated: 'Software Engineer',
    communication: 8,
    depth: 7,
    problemSolving: 9,
    overallScore: 8,
    hireRecommendation: 'hire',
    writtenFeedback: 'Strong algorithmic reasoning. Structured his code cleanly with edge case handling.'
  })

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || ''
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }

  // Load directory & initial tab data
  useEffect(() => {
    fetchDirectory()
    fetchSlots()
    fetchExperiences()
    fetchReferrals()
  }, [])

  const fetchDirectory = async () => {
    try {
      const res = await fetch('/api/alumni/directory', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setDirectory(data)
      }
    } catch (e) {
      console.error('Failed to load alumni directory', e)
    }
  }

  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/alumni/slots', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setSlots(data)
      }
    } catch (e) {
      console.error('Failed to load slots', e)
    }
  }

  const fetchExperiences = async () => {
    try {
      const res = await fetch('/api/alumni/experiences', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setExperiences(data)
      }
    } catch (e) {
      console.error('Failed to load experiences', e)
    }
  }

  const fetchReferrals = async () => {
    try {
      const res = await fetch('/api/alumni/referrals', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setReferrals(data)
      }
    } catch (e) {
      console.error('Failed to load referrals', e)
    }
  }

  // AI Semantic Matching
  const handleAiMatch = async () => {
    if (!goalsText.trim()) {
      toast.error('Please enter your target role, company, or dream focus areas.')
      return
    }
    setMatchingLoading(true)
    try {
      const res = await fetch('/api/alumni/match', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ goalsText })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMatchResults(data)
        toast.success(`Found ${data.length} top matching alumni mentors!`)
      } else {
        toast.error(data.error || 'Matching computation failed')
      }
    } catch (e) {
      toast.error('Error computing mentor matches')
    } finally {
      setMatchingLoading(false)
    }
  }

  // Book a mock interview slot
  const handleBookSlot = async (slotId) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/alumni/slots/${slotId}/book`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          goalsText: bookingGoals || 'Targeting FAANG/Tier-1 software engineering interviews'
        })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('🎉 Mock interview session booked with alumni!')
        setBookingSlot(null)
        fetchSlots()
        if (data.roomId) {
          navigate(`/peer-interview/${data.roomId}`)
        }
      } else {
        toast.error(data.error || 'Booking failed')
      }
    } catch (e) {
      toast.error('Failed to book slot')
    } finally {
      setLoading(false)
    }
  }

  // Apply for alumni referral
  const handleApplyReferral = async (referralId, role, company) => {
    try {
      const res = await fetch(`/api/alumni/referrals/${referralId}/apply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ resumeUrl: '/uploads/student-resume.pdf' })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(`Referral requested for ${company} (${role})! The alumni will review your profile.`)
      } else {
        toast.error(data.error || 'Failed to submit referral application')
      }
    } catch (e) {
      toast.error('Error applying for referral')
    }
  }

  // Submit interview experience
  const handleSubmitExperience = async (e) => {
    e.preventDefault()
    try {
      const rounds = [
        {
          roundName: newExp.round1Name || 'Round 1: Technical & DSA',
          roundType: 'technical',
          questionsAsked: newExp.round1Questions ? newExp.round1Questions.split(',').map(q => q.trim()).filter(Boolean) : ['Algorithmic questions']
        },
        {
          roundName: newExp.round2Name || 'Round 2: System Design',
          roundType: 'technical',
          questionsAsked: newExp.round2Questions ? newExp.round2Questions.split(',').map(q => q.trim()).filter(Boolean) : ['System Architecture']
        }
      ]
      const res = await fetch('/api/alumni/experiences', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          company: newExp.company,
          role: newExp.role,
          overallDifficulty: newExp.overallDifficulty,
          rounds,
          preparationTips: newExp.preparationTips
        })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Interview experience saved and indexed into institutional RAG!')
        setShowExpModal(false)
        fetchExperiences()
      } else {
        toast.error(data.error || 'Failed to submit experience')
      }
    } catch (err) {
      toast.error('Submission failed: ' + (err.message || 'Network error'))
    }
  }

  // Submit alumni scorecard
  const handleSubmitScorecard = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/alumni/scorecard', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          studentName: scorecardForm.studentName,
          studentRoll: scorecardForm.studentRoll,
          roleEvaluated: scorecardForm.roleEvaluated,
          rubric: {
            communication: scorecardForm.communication,
            depth: scorecardForm.depth,
            problemSolving: scorecardForm.problemSolving,
            overallScore: scorecardForm.overallScore
          },
          hireRecommendation: scorecardForm.hireRecommendation,
          writtenFeedback: scorecardForm.writtenFeedback
        })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('✅ Alumni scorecard recorded! Calibrating ML models.')
      } else {
        toast.error(data.error || 'Failed to record scorecard')
      }
    } catch (err) {
      toast.error('Error submitting scorecard')
    }
  }

  const companiesList = ['All', 'Google', 'Microsoft', 'Amazon', 'Goldman Sachs']
  const filteredDirectory = directory.filter(alumnus => {
    const matchesSearch = !searchTerm ||
      alumnus.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumnus.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumnus.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumnus.expertiseTags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCompany = companyFilter === 'All' || alumnus.company?.toLowerCase() === companyFilter.toLowerCase()
    return matchesSearch && matchesCompany
  })

  return (
    <div className="min-h-screen hero-bg pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Title Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-purple-900/40 to-slate-900/80 border border-blue-500/20 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-cyan-400 border border-cyan-500/30">
                <span>🎓</span> Institutional Alumni Support Network
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Alumni Mentorship & Placement Acceleration
              </h1>
              <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
                Connect directly with verified campus seniors working at Google, Microsoft, Amazon, and Goldman Sachs. Book 1-on-1 mock interviews, learn real round questions, and request referrals.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowExpModal(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all"
              >
                + Share Interview Experience
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto scrollbar-none gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
          {[
            { id: 'match', label: '🎯 AI Mentor Match', icon: '✨' },
            { id: 'directory', label: '👥 Mentor Directory', icon: '🏛️' },
            { id: 'slots', label: '📅 Mock Interview Slots', icon: '🕒' },
            { id: 'experiences', label: '📖 Interview Intel (RAG)', icon: '📚' },
            { id: 'referrals', label: '🚀 Referral Board', icon: '💼' },
            { id: 'scorecard', label: '📝 Mentor Scorecard', icon: '✍️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB 1: AI MENTOR MATCHING ─────────────────────────────────── */}
        {activeTab === 'match' && (
          <div className="space-y-6">
            <Card className="p-6 border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl">
              <div className="max-w-3xl space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🧠</span> Cosine-Similarity Mentor Matching
                </h2>
                <p className="text-slate-400 text-sm">
                  State your target company, dream role, and the technical topics you want to practice (e.g. distributed systems, system design, DSA, dynamic programming). The AI matches you with verified alumni having matching domain experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={goalsText}
                    onChange={(e) => setGoalsText(e.target.value)}
                    placeholder="e.g. Aiming for Google SDE-2, focusing on Distributed Systems, Go, and System Design"
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                  />
                  <Button
                    onClick={handleAiMatch}
                    disabled={matchingLoading}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                  >
                    {matchingLoading ? 'Analyzing...' : 'Find Top Mentors'}
                  </Button>
                </div>
              </div>
            </Card>

            {matchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>✨</span> Top Ranked Mentors ({matchResults.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchResults.map((item, idx) => {
                    const alumnus = item.alumni || item
                    return (
                      <Card key={idx} className="p-6 border-white/10 bg-slate-900/40 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-white">{alumnus.name}</h4>
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  ✓ Verified Alumni
                                </span>
                              </div>
                              <p className="text-cyan-400 text-sm font-medium">{alumnus.role} @ {alumnus.company}</p>
                              <p className="text-slate-400 text-xs">Batch of {alumnus.graduationYear} • {alumnus.department}</p>
                            </div>
                            <div className="text-right">
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                <span>{item.matchScore || 85}% Match</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-slate-300 text-xs leading-relaxed italic bg-white/5 p-3 rounded-lg border border-white/5">
                            "{item.explanation || alumnus.bio}"
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {(alumnus.expertiseTags || []).map((tag, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-white/5">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs text-amber-400 font-semibold">★ {alumnus.rating || 4.9} Rating</span>
                          <button
                            onClick={() => {
                              setActiveTab('slots')
                              setSearchTerm(alumnus.name)
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all"
                          >
                            View Available Slots →
                          </button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: MENTOR DIRECTORY ───────────────────────────────────── */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {companiesList.map(c => (
                  <button
                    key={c}
                    onClick={() => setCompanyFilter(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      companyFilter === c
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, skill, or topic..."
                className="w-full sm:w-72 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDirectory.map((alumnus) => (
                <Card key={alumnus._id} className="p-5 border-white/10 bg-slate-900/40 hover:border-blue-500/40 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-white">{alumnus.name}</h3>
                          <span className="text-cyan-400 text-xs" title="Verified Alumni">✓</span>
                        </div>
                        <p className="text-sm font-semibold text-blue-400">{alumnus.company}</p>
                        <p className="text-xs text-slate-400">{alumnus.role}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-amber-400 font-bold">★ {alumnus.rating || 4.9}</span>
                        <p className="text-[10px] text-slate-400">Class of '{alumnus.graduationYear}</p>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs line-clamp-3 leading-relaxed">
                      {alumnus.bio}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {(alumnus.expertiseTags || []).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-cyan-300 border border-cyan-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{alumnus.department} Department</span>
                    <button
                      onClick={() => {
                        setActiveTab('slots')
                        setSearchTerm(alumnus.name)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all"
                    >
                      Book Session →
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: MOCK INTERVIEW SLOTS ───────────────────────────────── */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📅</span> Upcoming 1-on-1 Alumni Mock Slots
                </h2>
                <p className="text-slate-400 text-sm">
                  Sessions include live audio/video and a collaborative code editor. Alumni will grade your interview against an enterprise rubric.
                </p>
              </div>
              <button
                onClick={fetchSlots}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded bg-white/5 border border-white/10"
              >
                ↻ Refresh Slots
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {slots.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-white/10">
                  No open slots found right now. Check back soon or request directly from the Mentor Directory.
                </div>
              ) : (
                slots.map(slot => (
                  <Card key={slot._id} className="p-5 border-white/10 bg-slate-900/40 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Available Slot
                          </span>
                          <h3 className="text-base font-bold text-white mt-1.5">{slot.alumniName}</h3>
                          <p className="text-xs text-cyan-400 font-medium">{slot.alumniCompany || 'Enterprise Tech'}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                          📹
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5 space-y-1">
                        <p className="text-xs text-slate-300 font-medium">Topic / Focus:</p>
                        <p className="text-xs text-slate-400">{slot.topic}</p>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span>🕒</span>
                        <span>{new Date(slot.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/5">
                      <Button
                        onClick={() => handleBookSlot(slot._id)}
                        disabled={loading}
                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold"
                      >
                        Book Mock Interview & Enter Room
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: COMPANY EXPERIENCES (RAG REPOSITORY) ────────────────── */}
        {activeTab === 'experiences' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📖</span> Verified Campus Interview Intelligence
                </h2>
                <p className="text-slate-400 text-sm">
                  Declassified round-by-round interview experiences from alumni. These reports feed the institutional RAG engine to generate customized practice drills.
                </p>
              </div>
              <Button
                onClick={() => setShowExpModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-xs"
              >
                + Contribute Experience
              </Button>
            </div>

            <div className="space-y-4">
              {experiences.map(exp => (
                <Card key={exp._id} className="p-6 border-white/10 bg-slate-900/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{exp.company}</h3>
                        <span className="text-slate-400 text-sm">— {exp.role}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          exp.overallDifficulty === 'Hard' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {exp.overallDifficulty} Difficulty
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Contributed by {exp.alumniName} (Class of {exp.graduationYear}) • Interview Year: {exp.interviewYear}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Offer Received
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rounds & Actual Questions Asked:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(exp.rounds || []).map((round, rIdx) => (
                        <div key={rIdx} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-300">{round.roundName}</span>
                            <span className="text-[10px] text-slate-400">{round.roundType}</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                            {(round.questionsAsked || []).map((q, qIdx) => (
                              <li key={qIdx}>{q}</li>
                            ))}
                          </ul>
                          {round.tips && (
                            <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/5">💡 Tip: {round.tips}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {exp.preparationTips && (
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-slate-300">
                      <strong className="text-cyan-400">Preparation Advice: </strong> {exp.preparationTips}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: REFERRAL BOARD ─────────────────────────────────────── */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🚀</span> Alumni Referral Board
              </h2>
              <p className="text-slate-400 text-sm">
                Fast-track your job and internship applications by requesting employee referrals directly from campus alumni.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {referrals.map(ref => (
                <Card key={ref._id} className="p-5 border-white/10 bg-slate-900/40 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          Active Referral
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">{ref.role}</h3>
                        <p className="text-xs text-cyan-400 font-semibold">{ref.company}</p>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{ref.jobLocation}</span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {ref.jobDescription}
                    </p>

                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-400">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {(ref.requiredSkills || []).map((skill, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-white/5">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Referred by: <strong className="text-slate-200">{ref.alumniName}</strong>
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-2">
                    <Button
                      onClick={() => handleApplyReferral(ref._id, ref.role, ref.company)}
                      className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold"
                    >
                      Request Referral
                    </Button>
                    {ref.externalJobUrl && (
                      <a
                        href={ref.externalJobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/10"
                      >
                        Job Link ↗
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 6: MENTOR SCORECARD (ML GROUND TRUTH) ────────────────── */}
        {activeTab === 'scorecard' && (
          <div className="space-y-6">
            <Card className="p-6 border-white/10 bg-slate-900/60 max-w-2xl mx-auto space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>✍️</span> Alumni Rubric Evaluation Form
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed">
                  For alumni mentors to submit ratings after conducting mock interviews. This human feedback serves as the ground-truth benchmark for calibrating the AI scoring models.
                </p>
              </div>

              <form onSubmit={handleSubmitScorecard} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Candidate Name</label>
                    <input
                      type="text"
                      value={scorecardForm.studentName}
                      onChange={e => setScorecardForm({ ...scorecardForm, studentName: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Roll Number</label>
                    <input
                      type="text"
                      value={scorecardForm.studentRoll}
                      onChange={e => setScorecardForm({ ...scorecardForm, studentRoll: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Rubric sliders */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Communication & Clarity: <strong>{scorecardForm.communication} / 10</strong></span>
                    <input
                      type="range" min="1" max="10"
                      value={scorecardForm.communication}
                      onChange={e => setScorecardForm({ ...scorecardForm, communication: e.target.value })}
                      className="w-36 accent-cyan-400"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Technical Depth: <strong>{scorecardForm.depth} / 10</strong></span>
                    <input
                      type="range" min="1" max="10"
                      value={scorecardForm.depth}
                      onChange={e => setScorecardForm({ ...scorecardForm, depth: e.target.value })}
                      className="w-36 accent-cyan-400"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Problem Solving & DSA: <strong>{scorecardForm.problemSolving} / 10</strong></span>
                    <input
                      type="range" min="1" max="10"
                      value={scorecardForm.problemSolving}
                      onChange={e => setScorecardForm({ ...scorecardForm, problemSolving: e.target.value })}
                      className="w-36 accent-cyan-400"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                    <span className="text-cyan-400 font-bold">Overall Mock Rating: <strong>{scorecardForm.overallScore} / 10</strong></span>
                    <input
                      type="range" min="1" max="10"
                      value={scorecardForm.overallScore}
                      onChange={e => setScorecardForm({ ...scorecardForm, overallScore: e.target.value })}
                      className="w-36 accent-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium">Hiring Recommendation</label>
                  <select
                    value={scorecardForm.hireRecommendation}
                    onChange={e => setScorecardForm({ ...scorecardForm, hireRecommendation: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                  >
                    <option value="strong_hire">Strong Hire</option>
                    <option value="hire">Hire</option>
                    <option value="lean_hire">Lean Hire</option>
                    <option value="lean_no_hire">Lean No Hire</option>
                    <option value="no_hire">No Hire</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium">Written Feedback for Candidate</label>
                  <textarea
                    rows={3}
                    value={scorecardForm.writtenFeedback}
                    onChange={e => setScorecardForm({ ...scorecardForm, writtenFeedback: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-xs"
                >
                  Submit Scorecard & Retrain Ground Truth
                </Button>
              </form>
            </Card>
          </div>
        )}

      </div>

      {/* Experience Contribution Modal */}
      <AnimatePresence>
        {showExpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Contribute Company Experience</h3>
                <button onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSubmitExperience} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300">Company</label>
                    <input
                      type="text"
                      value={newExp.company}
                      onChange={e => setNewExp({ ...newExp, company: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300">Role</label>
                    <input
                      type="text"
                      value={newExp.role}
                      onChange={e => setNewExp({ ...newExp, role: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300">Round 1 (Name & Questions)</label>
                  <input
                    type="text"
                    value={newExp.round1Name}
                    onChange={e => setNewExp({ ...newExp, round1Name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                  />
                  <input
                    type="text"
                    value={newExp.round1Questions}
                    onChange={e => setNewExp({ ...newExp, round1Questions: e.target.value })}
                    placeholder="Comma-separated questions asked"
                    className="w-full mt-1.5 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300">Preparation Tips</label>
                  <textarea
                    rows={2}
                    value={newExp.preparationTips}
                    onChange={e => setNewExp({ ...newExp, preparationTips: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExpModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <Button type="submit" className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-500">
                    Save Experience
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
