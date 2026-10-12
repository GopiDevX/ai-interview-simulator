import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { collegeApi } from '../../api/college'
import Loader from '../../components/ui/Loader'

export default function CollegeDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Data states
  const [overview, setOverview] = useState(null)
  const [students, setStudents] = useState([])
  const [drives, setDrives] = useState([])
  const [analytics, setAnalytics] = useState(null)

  // Filters for student roster
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [minCgpa, setMinCgpa] = useState('')

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [customCollegeUploadName, setCustomCollegeUploadName] = useState('')
  const [clearExistingOnUpload, setClearExistingOnUpload] = useState(false)

  const [showInstitutionModal, setShowInstitutionModal] = useState(false)
  const [instName, setInstName] = useState('')
  const [instCode, setInstCode] = useState('')
  const [instDomain, setInstDomain] = useState('')
  const [savingInst, setSavingInst] = useState(false)

  const [showCreateDriveModal, setShowCreateDriveModal] = useState(false)
  const [newDrive, setNewDrive] = useState({
    title: '',
    company: 'Accenture',
    role: 'Associate Software Engineer',
    targetBatch: '2026',
    endDate: '',
    proctoringLevel: 'strict',
    description: ''
  })
  const [creatingDrive, setCreatingDrive] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState(null)

  // Recruiter export cutoffs
  const [exportCutoffCgpa, setExportCutoffCgpa] = useState(7.5)
  const [exportCutoffScore, setExportCutoffScore] = useState(70)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [overRes, stuRes, drvRes, anaRes] = await Promise.all([
        collegeApi.getOverview(),
        collegeApi.getStudents(),
        collegeApi.getDrives(),
        collegeApi.getAnalytics()
      ])

      setOverview(overRes.data)
      setStudents(stuRes.data.students || [])
      setDrives(drvRes.data.drives || [])
      setAnalytics(anaRes.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load institution data')
    } finally {
      setLoading(false)
    }
  }

  // Handle student CSV upload
  const handleRosterUpload = async (e) => {
    e.preventDefault()
    if (!csvText.trim()) {
      return toast.error('Please paste CSV contents or upload a file')
    }

    setUploading(true)
    try {
      const res = await collegeApi.uploadRoster({
        csvData: csvText,
        collegeName: customCollegeUploadName,
        clearExisting: clearExistingOnUpload
      })
      toast.success(res.data.message || 'Students imported successfully!')
      setShowUploadModal(false)
      setCsvText('')
      setCustomCollegeUploadName('')
      loadDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload roster')
    } finally {
      setUploading(false)
    }
  }

  // Handle Institution Profile Update (Allows using any college name)
  const handleUpdateInstitution = async (e) => {
    e.preventDefault()
    if (!instName.trim()) return toast.error('Please enter an institution name')

    setSavingInst(true)
    try {
      await collegeApi.updateProfile({
        name: instName.trim(),
        code: instCode.trim() || 'CAMPUS',
        domain: instDomain.trim() || 'university.edu'
      })
      toast.success('Institution profile updated successfully!')
      setShowInstitutionModal(false)
      loadDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update institution profile')
    } finally {
      setSavingInst(false)
    }
  }

  // Handle File Input for CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvText(event.target.result)
    }
    reader.readAsText(file)
  }

  // Handle Drive Creation
  const handleCreateDrive = async (e) => {
    e.preventDefault()
    if (!newDrive.title || !newDrive.company || !newDrive.role || !newDrive.endDate) {
      return toast.error('Please fill all required drive details')
    }

    setCreatingDrive(true)
    try {
      await collegeApi.createDrive(newDrive)
      toast.success('Placement Mock Drive created successfully!')
      setShowCreateDriveModal(false)
      setNewDrive({
        title: '',
        company: 'Accenture',
        role: 'Associate Software Engineer',
        targetBatch: '2026',
        endDate: '',
        proctoringLevel: 'strict',
        description: ''
      })
      loadDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule drive')
    } finally {
      setCreatingDrive(false)
    }
  }

  // Filtered students list
  const filteredStudents = students.filter(s => {
    if (selectedDept !== 'all' && s.department !== selectedDept) return false
    if (selectedTier !== 'all' && s.predictedTier !== selectedTier) return false
    if (minCgpa && s.cgpa < parseFloat(minCgpa)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return s.name.toLowerCase().includes(q) ||
             s.rollNumber.toLowerCase().includes(q) ||
             s.email.toLowerCase().includes(q)
    }
    return true
  })

  // Get tier badge styling
  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Tier 1 Ready':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      case 'Tier 2 Ready':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      case 'Needs Training':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen hero-bg pt-20 px-4 flex items-center justify-center">
        <Loader size="lg" text="Loading Institution Intelligence Portal..." />
      </div>
    )
  }

  const collegeName = overview?.college?.name || 'Campus Placement & Training Directorate'
  const metrics = overview?.metrics || {
    totalStudents: 32,
    activeDrives: 2,
    totalCompletedMocks: 26,
    avgScore: 78.4,
    readinessRate: '82%'
  }

  return (
    <div className="min-h-screen hero-bg pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Institutional Top Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-electric-cyan/20 text-electric-cyan border border-electric-cyan/30">
                  Institutional Campus Portal
                </span>
                <span className="px-2.5 py-0.5 text-xs font-mono text-slate-400 bg-white/5 rounded border border-white/10">
                  CODE: {overview?.college?.code || 'CAMPUS'}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Placement Season Active
                </span>
                <button
                  onClick={() => {
                    setInstName(overview?.college?.name || '')
                    setInstCode(overview?.college?.code || '')
                    setInstDomain(overview?.college?.domain || '')
                    setShowInstitutionModal(true)
                  }}
                  className="px-2.5 py-0.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 flex items-center gap-1 transition-all"
                >
                  <span>✏️</span>
                  <span>Set College Name</span>
                </button>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
                {collegeName}
              </h1>
              <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
                Universal Campus Placement & Assessment Command: Configure for any college, manage student rosters, conduct automated AI mock drives, and analyze institutional readiness.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  setInstName(overview?.college?.name || '')
                  setInstCode(overview?.college?.code || '')
                  setInstDomain(overview?.college?.domain || '')
                  setShowInstitutionModal(true)
                }}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>🏛️</span>
                <span>Configure College</span>
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>📥</span>
                <span>Import Student CSV</span>
              </button>

              <button
                onClick={() => setShowCreateDriveModal(true)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-electric-cyan to-electric-blue text-navy-950 font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] flex items-center gap-2"
              >
                <span>🚀</span>
                <span>Schedule Mock Drive</span>
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Enrolled</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1 tabular-nums">{metrics.totalStudents}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified roster records</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Drives</p>
              <p className="text-2xl sm:text-3xl font-black text-electric-cyan mt-1 tabular-nums">{metrics.activeDrives}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Company placement tracks</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Completed Mocks</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 tabular-nums">{metrics.totalCompletedMocks}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Video & coding sessions</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Cohort Avg Score</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 tabular-nums">{metrics.avgScore}<span className="text-base text-slate-400 font-normal">/100</span></p>
              <p className="text-[11px] text-slate-500 mt-0.5">Hybrid ML evaluation</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5 col-span-2 md:col-span-1">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Readiness Rate</p>
              <p className="text-2xl sm:text-3xl font-black text-purple-400 mt-1 tabular-nums">{metrics.readinessRate}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tier-1 & Tier-2 clearance</p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Institutional Pulse', icon: '🏛️' },
            { id: 'drives', label: `🎯 Mock Drives (${drives.length})`, icon: '🎯' },
            { id: 'students', label: `👥 Student Database (${students.length})`, icon: '👥' },
            { id: 'analytics', label: '📈 Performance & Skill Gaps', icon: '📈' },
            { id: 'recruiter', label: '📑 Recruiter Shortlist Export', icon: '📑' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Placement Readiness Breakdown */}
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <span>🎯</span> Company Placement Readiness
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">AI Prediction based on candidate evaluations</p>

                  <div className="space-y-4">
                    {analytics?.tierDistribution?.map((tier, idx) => {
                      const colors = {
                        'Tier 1 Ready': 'from-emerald-500 to-teal-400',
                        'Tier 2 Ready': 'from-amber-500 to-orange-400',
                        'Needs Training': 'from-rose-500 to-pink-500',
                        'Unassessed': 'from-slate-600 to-slate-500'
                      }
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{tier.name}</span>
                            <span className="text-white font-mono">{tier.value} students ({tier.percentage}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colors[tier.name] || 'from-blue-500 to-cyan-400'} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(tier.percentage, 4)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400">
                  <p>💡 <strong>Tier 1 Target:</strong> Google, Amazon, Microsoft (Score &ge; 85%)</p>
                  <p className="mt-1">💡 <strong>Tier 2 Target:</strong> Accenture, TCS, Cognizant, Wipro (Score &ge; 65%)</p>
                </div>
              </div>

              {/* Department Performance Bar Chart */}
              <div className="glass-card p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>🏢</span> Department-Wise Average Scores
                    </h3>
                    <p className="text-xs text-slate-400">Comparison of average mock scores across academic branches</p>
                  </div>
                </div>

                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.departments || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="department"
                        stroke="#64748b"
                        fontSize={11}
                        tickFormatter={(val) => val.split(' ')[0]}
                      />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="avgScore" name="Avg Overall Score" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="avgCodeScore" name="Coding Score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Active Drives Strip */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🔥</span> Ongoing Campus Placement Drives
                  </h3>
                  <p className="text-xs text-slate-400">Live mock test pipelines currently accessible to eligible students</p>
                </div>
                <button
                  onClick={() => setActiveTab('drives')}
                  className="text-xs text-electric-cyan hover:underline font-semibold"
                >
                  View All Drives &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {drives.map(drive => (
                  <div key={drive.driveId} className="bg-white/5 hover:bg-white/10 transition-colors p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-electric-cyan/20 text-electric-cyan border border-electric-cyan/30">
                          {drive.company}
                        </span>
                        <span className={`text-[11px] font-bold uppercase ${drive.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          ● {drive.status}
                        </span>
                      </div>
                      <h4 className="text-white font-bold text-base mb-1">{drive.title}</h4>
                      <p className="text-slate-400 text-xs mb-3">{drive.role}</p>

                      <div className="flex items-center justify-between text-xs text-slate-300 py-2 border-y border-white/5 my-3">
                        <span>Completed Mocks:</span>
                        <span className="font-bold text-white">{drive.totalCompleted} students</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        to={`/setup?company=${encodeURIComponent(drive.company)}&role=${encodeURIComponent(drive.role)}&driveId=${drive.driveId}`}
                        className="w-full text-center py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                      >
                        Preview / Test Drive
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Performers Leaderboard */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <span>🏆</span> Campus Placement Star Performers
              </h3>
              <p className="text-xs text-slate-400 mb-6">Top students demonstrating high technical accuracy, coding mastery, and proctoring integrity</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 font-bold">Rank</th>
                      <th className="px-4 py-3 font-bold">Student</th>
                      <th className="px-4 py-3 font-bold">Department</th>
                      <th className="px-4 py-3 font-bold text-center">CGPA</th>
                      <th className="px-4 py-3 font-bold text-center">AI Mock Score</th>
                      <th className="px-4 py-3 font-bold text-center">Placement Tier</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {students
                      .filter(s => s.avgScore > 0)
                      .sort((a, b) => b.avgScore - a.avgScore)
                      .slice(0, 5)
                      .map((stu, rank) => (
                        <tr key={stu.rollNumber} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-bold">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              rank === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              rank === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                              rank === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                              'text-slate-400'
                            }`}>
                              #{rank + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/30">
                                {stu.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-white font-bold">{stu.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{stu.rollNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300">{stu.department}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-200">{stu.cgpa}</td>
                          <td className="px-4 py-3 text-center font-bold text-electric-cyan text-base">
                            {stu.avgScore} <span className="text-xs text-slate-500 font-normal">/100</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getTierBadge(stu.predictedTier)}`}>
                              {stu.predictedTier}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedStudent(stu)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                              Inspect Dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DRIVES */}
        {activeTab === 'drives' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Campus Placement Mock Drives</h3>
                <p className="text-xs text-slate-400 mt-1">Simulate real company hiring pipelines for targeted batches with automatic rubric injection</p>
              </div>
              <button
                onClick={() => setShowCreateDriveModal(true)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-electric-cyan to-electric-blue text-navy-950 shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-2 self-start"
              >
                <span>➕</span>
                <span>Create New Placement Drive</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drives.map(drive => (
                <div key={drive.driveId} className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {drive.company}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                        drive.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        drive.status === 'upcoming' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        ● {drive.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-bold text-white">{drive.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{drive.role} · Batch {drive.targetBatch}</p>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">{drive.description}</p>

                    <div className="space-y-2 py-3 border-y border-white/5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Branches:</span>
                        <span className="text-white font-medium text-right max-w-[200px] truncate">
                          {drive.targetDepartments?.join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Strict Proctoring:</span>
                        <span className="text-emerald-400 font-bold uppercase">
                          {drive.proctoringLevel === 'strict' ? '🔒 Active (HUD & Camera)' : 'Standard'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Completed Sessions:</span>
                        <span className="text-white font-bold">{drive.totalCompleted} students</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-2">
                    <Link
                      to={`/setup?company=${encodeURIComponent(drive.company)}&role=${encodeURIComponent(drive.role)}&driveId=${drive.driveId}`}
                      className="flex-1 text-center py-2.5 rounded-xl bg-electric-cyan text-navy-950 font-bold text-xs hover:bg-cyan-300 transition-colors shadow-md"
                    >
                      🚀 Take Mock Test
                    </Link>
                    <button
                      onClick={() => {
                        const directUrl = `${window.location.origin}/setup?company=${encodeURIComponent(drive.company)}&role=${encodeURIComponent(drive.role)}&driveId=${drive.driveId}`
                        navigator.clipboard.writeText(directUrl)
                        toast.success('Mock drive invitation link copied to clipboard!')
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors text-xs"
                      title="Copy student invitation link"
                    >
                      🔗 Copy Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT DATABASE / ROSTER */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Student Master Database</h3>
                  <p className="text-xs text-slate-400 mt-1">Search, filter, and review candidates across departments and placement readiness tiers</p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={collegeApi.getSampleCsvUrl()}
                    download="student_roster_template.csv"
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1.5 transition-colors"
                  >
                    <span>📄</span>
                    <span>Download CSV Template</span>
                  </a>

                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>📥</span>
                    <span>Upload Student CSV</span>
                  </button>
                </div>
              </div>

              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Search Candidate</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, roll no, email..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-cyan"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-cyan"
                  >
                    <option value="all">All Departments</option>
                    <option value="Computer Science & Engineering">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Comm</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Readiness Tier</label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-cyan"
                  >
                    <option value="all">All Tiers</option>
                    <option value="Tier 1 Ready">Tier 1 Ready (&ge; 85%)</option>
                    <option value="Tier 2 Ready">Tier 2 Ready (65-84%)</option>
                    <option value="Needs Training">Needs Training (&lt; 65%)</option>
                    <option value="Unassessed">Unassessed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-cyan"
                  />
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-5 py-3 font-bold">Roll Number</th>
                      <th className="px-5 py-3 font-bold">Student Name</th>
                      <th className="px-5 py-3 font-bold">Department</th>
                      <th className="px-5 py-3 font-bold text-center">CGPA</th>
                      <th className="px-5 py-3 font-bold text-center">Mocks Taken</th>
                      <th className="px-5 py-3 font-bold text-center">Avg AI Score</th>
                      <th className="px-5 py-3 font-bold text-center">Placement Tier</th>
                      <th className="px-5 py-3 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                          No students matching selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(stu => (
                        <tr key={stu.rollNumber} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs font-bold text-electric-cyan">{stu.rollNumber}</td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="text-white font-bold">{stu.name}</p>
                              <p className="text-[11px] text-slate-500">{stu.email}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-300">{stu.department}</td>
                          <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-200">{stu.cgpa}</td>
                          <td className="px-5 py-3.5 text-center font-semibold text-slate-300">{stu.totalMocksTaken || 0}</td>
                          <td className="px-5 py-3.5 text-center">
                            {stu.avgScore > 0 ? (
                              <span className="font-bold text-white">{stu.avgScore}<span className="text-xs text-slate-500">/100</span></span>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Not taken</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getTierBadge(stu.predictedTier)}`}>
                              {stu.predictedTier}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedStudent(stu)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                              View Dossier
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {filteredStudents.length} of {students.length} registered students</span>
                <span>Batch of 2026</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PERFORMANCE & SKILL GAPS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Institutional Skill Competency Radar */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span>🎯</span> Campus Skill Competency Radar
                </h3>
                <p className="text-xs text-slate-400 mb-6">Aggregated performance across core hiring dimensions</p>

                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReRadarChart cx="50%" cy="50%" outerRadius="75%" data={analytics?.skillMetrics || []}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} />
                      <Radar name="Campus Benchmark" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                    </ReRadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
                  <div className="p-2 rounded bg-white/5">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Strongest Skill</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">Integrity (96%)</p>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Verbal Comms</p>
                    <p className="text-xs font-bold text-cyan-400 mt-0.5">Fluent (85%)</p>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Primary Weakness</p>
                    <p className="text-xs font-bold text-rose-400 mt-0.5">System Logic (74%)</p>
                  </div>
                </div>
              </div>

              {/* Department Comparison Table */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span>🏢</span> Department Heatmap & Proctoring Integrity
                </h3>
                <p className="text-xs text-slate-400 mb-6">Detailed branch metrics including coding precision and proctor integrity</p>

                <div className="space-y-4">
                  {analytics?.departments?.map((dept, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">{dept.department}</span>
                        <span className="text-xs font-mono text-slate-400">{dept.studentCount} Students</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white/5 p-2 rounded">
                          <p className="text-[10px] text-slate-400 uppercase">AI Overall</p>
                          <p className="font-bold text-electric-cyan mt-0.5">{dept.avgScore}%</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <p className="text-[10px] text-slate-400 uppercase">Code Score</p>
                          <p className="font-bold text-blue-400 mt-0.5">{dept.avgCodeScore}%</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <p className="text-[10px] text-slate-400 uppercase">Proctor Integrity</p>
                          <p className="font-bold text-emerald-400 mt-0.5">{dept.avgIntegrityScore}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI-Generated Remedial Action Plans for TPO */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🤖</span>
                <h3 className="text-lg font-bold text-white">AI-Powered Institutional Remedial Recommendations</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Automatically generated by cross-referencing candidate answer failures and company hiring rubrics
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics?.remedialPlan?.map((plan, idx) => (
                  <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {plan.department}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-2">{plan.topic}</h4>
                      <p className="text-xs text-amber-300 font-semibold mb-3">⚠️ {plan.impact}</p>
                      <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                        {plan.recommendation}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Action: Schedule Bootcamp</span>
                      <span className="text-electric-cyan font-bold cursor-pointer hover:underline">Deploy &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RECRUITER SHORTLIST EXPORT */}
        {activeTab === 'recruiter' && (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">📑</span>
                <h3 className="text-2xl font-bold text-white">Recruiter Ready Placement Export</h3>
              </div>
              <p className="text-slate-400 text-sm max-w-2xl">
                Configure instant academic and AI score cutoffs to generate recruiter-ready candidate rosters in CSV/Excel format for campus hiring visits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Minimum CGPA Cutoff: <span className="text-electric-cyan font-bold font-mono text-sm">{exportCutoffCgpa}</span>
                </label>
                <input
                  type="range"
                  min="6.0"
                  max="9.5"
                  step="0.1"
                  value={exportCutoffCgpa}
                  onChange={(e) => setExportCutoffCgpa(parseFloat(e.target.value))}
                  className="w-full accent-electric-cyan cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>6.0</span>
                  <span>7.5</span>
                  <span>9.0</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Minimum AI Mock Score: <span className="text-amber-400 font-bold font-mono text-sm">{exportCutoffScore}%</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="90"
                  step="5"
                  value={exportCutoffScore}
                  onChange={(e) => setExportCutoffScore(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>50%</span>
                  <span>70%</span>
                  <span>90%</span>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <a
                  href={collegeApi.getRecruiterExportUrl({ minCgpa: exportCutoffCgpa, minScore: exportCutoffScore })}
                  download="Recruiter_Campus_Shortlist.csv"
                  className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-center shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <span>📥</span>
                  <span>Download Recruiter Shortlist CSV</span>
                </a>
              </div>
            </div>

            {/* Live Filter Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-sm">
                  Preview Qualified Candidates:
                </h4>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  {students.filter(s => s.cgpa >= exportCutoffCgpa && s.avgScore >= exportCutoffScore).length} Qualified Students
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 font-bold">Roll No</th>
                      <th className="px-4 py-3 font-bold">Candidate</th>
                      <th className="px-4 py-3 font-bold">Department</th>
                      <th className="px-4 py-3 font-bold text-center">CGPA</th>
                      <th className="px-4 py-3 font-bold text-center">Mock Score</th>
                      <th className="px-4 py-3 font-bold text-center">Integrity</th>
                      <th className="px-4 py-3 font-bold text-center">Readiness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {students
                      .filter(s => s.cgpa >= exportCutoffCgpa && s.avgScore >= exportCutoffScore)
                      .map(stu => (
                        <tr key={stu.rollNumber} className="hover:bg-white/5">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-electric-cyan">{stu.rollNumber}</td>
                          <td className="px-4 py-3 font-bold text-white">{stu.name}</td>
                          <td className="px-4 py-3 text-xs">{stu.department}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold">{stu.cgpa}</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-400">{stu.avgScore}%</td>
                          <td className="px-4 py-3 text-center text-xs text-slate-300">98%</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getTierBadge(stu.predictedTier)}`}>
                              {stu.predictedTier}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ==================================================== */}
      {/* MODAL 1: IMPORT STUDENT CSV */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-xl w-full p-6 sm:p-8 space-y-6 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>📥</span> Import Student Roster (CSV)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Upload a CSV file or paste tabular student records</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-white text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                {/* File picker */}
                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-electric-cyan transition-colors bg-white/5">
                  <p className="text-sm font-semibold text-white mb-1">Select CSV file from your computer</p>
                  <p className="text-xs text-slate-400 mb-3">Expected columns: Roll Number, Name, Email, Department, Batch, CGPA</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-electric-cyan file:text-navy-950 hover:file:bg-cyan-300 cursor-pointer"
                  />
                </div>

                {/* College / Institution Assignment */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Target Institution Name (Optional):
                  </label>
                  <input
                    type="text"
                    value={customCollegeUploadName}
                    onChange={(e) => setCustomCollegeUploadName(e.target.value)}
                    placeholder="e.g. Any College Name (leave blank to keep current)"
                    className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-electric-cyan"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={clearExistingOnUpload}
                      onChange={(e) => setClearExistingOnUpload(e.target.checked)}
                      className="rounded accent-electric-cyan cursor-pointer"
                    />
                    <span>Replace existing database with this uploaded roster</span>
                  </label>
                </div>

                {/* Paste Area */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">Or Paste Raw CSV Data:</label>
                    <a
                      href={collegeApi.getSampleCsvUrl()}
                      download="student_template.csv"
                      className="text-[11px] text-electric-cyan hover:underline"
                    >
                      Download Sample Format
                    </a>
                  </div>
                  <textarea
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder={`Roll Number,Name,Email,Department,Batch,Section,CGPA,Phone\n22CSE099,Candidate Name,candidate@university.edu,Computer Science & Engineering,2026,A,8.5,+91 9876543210`}
                    className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-electric-cyan"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRosterUpload}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-electric-cyan to-electric-blue text-navy-950 disabled:opacity-50"
                >
                  {uploading ? 'Processing CSV...' : 'Import Students'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL 2: SCHEDULE PLACEMENT MOCK DRIVE */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showCreateDriveModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-lg w-full p-6 sm:p-8 space-y-6 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>🚀</span> Schedule Campus Mock Drive
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Configure automated assessment pipeline for students</p>
                </div>
                <button
                  onClick={() => setShowCreateDriveModal(false)}
                  className="text-slate-400 hover:text-white text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Drive Title *</label>
                  <input
                    type="text"
                    required
                    value={newDrive.title}
                    onChange={(e) => setNewDrive({ ...newDrive, title: e.target.value })}
                    placeholder="e.g. Accenture Day-1 Campus Mock Sprint"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-electric-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 uppercase block mb-1">Target Company *</label>
                    <select
                      value={newDrive.company}
                      onChange={(e) => setNewDrive({ ...newDrive, company: e.target.value })}
                      className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-electric-cyan"
                    >
                      {['Accenture', 'Google', 'Amazon', 'TCS', 'Infosys', 'Cognizant', 'Wipro', 'Microsoft'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 uppercase block mb-1">Target Role *</label>
                    <input
                      type="text"
                      required
                      value={newDrive.role}
                      onChange={(e) => setNewDrive({ ...newDrive, role: e.target.value })}
                      placeholder="e.g. Associate Software Engineer"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-electric-cyan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 uppercase block mb-1">Target Batch</label>
                    <select
                      value={newDrive.targetBatch}
                      onChange={(e) => setNewDrive({ ...newDrive, targetBatch: e.target.value })}
                      className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-electric-cyan"
                    >
                      <option value="2025">Batch of 2025</option>
                      <option value="2026">Batch of 2026</option>
                      <option value="2027">Batch of 2027</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 uppercase block mb-1">Deadline Date *</label>
                    <input
                      type="date"
                      required
                      value={newDrive.endDate}
                      onChange={(e) => setNewDrive({ ...newDrive, endDate: e.target.value })}
                      className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-electric-cyan"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Proctoring Strictness</label>
                  <select
                    value={newDrive.proctoringLevel}
                    onChange={(e) => setNewDrive({ ...newDrive, proctoringLevel: e.target.value })}
                    className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-electric-cyan"
                  >
                    <option value="strict">Strict (Camera, Audio & Tab Tamper Flagging)</option>
                    <option value="standard">Standard (Relaxed Mock Simulation)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Instructions for Students</label>
                  <textarea
                    rows={2}
                    value={newDrive.description}
                    onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
                    placeholder="Instructions regarding attire, duration, and test environment..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-electric-cyan"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateDriveModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingDrive}
                    className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-electric-cyan to-electric-blue text-navy-950 disabled:opacity-50"
                  >
                    {creatingDrive ? 'Scheduling...' : 'Launch Drive'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL 3: INDIVIDUAL STUDENT DOSSIER DRILLDOWN */}
      {/* ==================================================== */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-white/20 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-electric-cyan to-electric-blue text-navy-950 font-black text-xl flex items-center justify-center shadow-lg">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedStudent.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {selectedStudent.rollNumber} · {selectedStudent.department} (Batch {selectedStudent.batch})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-slate-400 hover:text-white text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Academic & Placement Stats */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Academic CGPA</p>
                  <p className="text-lg font-black text-white mt-0.5">{selectedStudent.cgpa}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">AI Mock Score</p>
                  <p className="text-lg font-black text-electric-cyan mt-0.5">{selectedStudent.avgScore || 0}%</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Total Mocks</p>
                  <p className="text-lg font-black text-purple-400 mt-0.5">{selectedStudent.totalMocksTaken || 0}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Readiness Tier</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${getTierBadge(selectedStudent.predictedTier)}`}>
                    {selectedStudent.predictedTier}
                  </span>
                </div>
              </div>

              {/* Drive History */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Campus Mock History & Proctoring Integrity</h4>

                {(!selectedStudent.driveHistory || selectedStudent.driveHistory.length === 0) ? (
                  <p className="text-xs text-slate-400 italic bg-white/5 p-4 rounded-xl text-center">
                    Candidate has not completed any assigned mock drives yet.
                  </p>
                ) : (
                  selectedStudent.driveHistory.map((sub, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white uppercase">{sub.driveId.replace('drv_', '').replace('_', ' ')}</p>
                          <p className="text-[10px] text-slate-400">
                            Completed on {sub.completedAt ? new Date(sub.completedAt).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                        <span className="text-sm font-black text-emerald-400">
                          {sub.overallScore}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-white/5 p-2 rounded">
                          <p className="text-[9px] text-slate-400 uppercase">Technical</p>
                          <p className="font-bold text-white mt-0.5">{sub.technicalScore}%</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <p className="text-[9px] text-slate-400 uppercase">Communication</p>
                          <p className="font-bold text-white mt-0.5">{sub.communicationScore}%</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <p className="text-[9px] text-slate-400 uppercase">Coding Score</p>
                          <p className="font-bold text-blue-400 mt-0.5">{sub.codeScore}%</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <p className="text-[9px] text-slate-400 uppercase">Integrity</p>
                          <p className="font-bold text-emerald-400 mt-0.5">{sub.integrityScore}%</p>
                        </div>
                      </div>

                      {sub.flaggedIssues && sub.flaggedIssues.length > 0 && (
                        <div className="text-[11px] text-rose-300 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                          ⚠️ <strong>Proctor Alerts:</strong> {sub.flaggedIssues.join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-white/10">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* MODAL 4: CONFIGURE INSTITUTION / ANY COLLEGE NAME */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showInstitutionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-md w-full p-6 sm:p-8 space-y-6 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>🏛️</span> Institution Profile Settings
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Configure for any college or university campus</p>
                </div>
                <button
                  onClick={() => setShowInstitutionModal(false)}
                  className="text-slate-400 hover:text-white text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateInstitution} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">
                    College / University Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    placeholder="e.g. Stanford University / Anna University / IIT Madras"
                    className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-electric-cyan"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    This name will appear on all dashboards, placement drive banners, and recruiter exports.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 uppercase block mb-1">Institution Code</label>
                    <input
                      type="text"
                      value={instCode}
                      onChange={(e) => setInstCode(e.target.value)}
                      placeholder="e.g. AU / IITM / MIT"
                      className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-white uppercase focus:outline-none focus:border-electric-cyan"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 uppercase block mb-1">Domain</label>
                    <input
                      type="text"
                      value={instDomain}
                      onChange={(e) => setInstDomain(e.target.value)}
                      placeholder="e.g. college.edu / ac.in"
                      className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-electric-cyan"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowInstitutionModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingInst}
                    className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-electric-cyan to-electric-blue text-navy-950 disabled:opacity-50"
                  >
                    {savingInst ? 'Saving...' : 'Apply Institution Name'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
