import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { interviewApi } from '../api/interview.js'
import { CircularScore } from '../components/report/ScoreCard.jsx'
import ScoreCard from '../components/report/ScoreCard.jsx'
import FeedbackSection from '../components/report/FeedbackSection.jsx'
import RadarChart from '../components/report/RadarChart.jsx'
import Loader from '../components/ui/Loader.jsx'
import Button from '../components/ui/Button.jsx'
import { getHireColor } from '../utils/helpers.js'

export default function Report() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    generateReport()
  }, [sessionId])

  const generateReport = async () => {
    setGenerating(true)
    try {
      const { data } = await interviewApi.generateReport(sessionId)
      setReport(data)
    } catch (err) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  const handleDownloadPDF = () => {
    window.print()
    toast.success('Print dialog opened — save as PDF')
  }

  if (loading || generating) {
    return (
      <div className="min-h-screen hero-bg pt-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader size="lg" />
          <h2 className="text-white text-xl font-semibold">Generating Your Report</h2>
          <p className="text-slate-400">Analyzing your interview performance...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen hero-bg pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Report not found</p>
          <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    )
  }

  const hireColorClass = getHireColor(report.hiringSuggestion)

  return (
    <div className="min-h-screen hero-bg pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Interview Report</h1>
            <p className="text-slate-400 mt-1">
              {report.role} · {report.company}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>
              📥 Download PDF
            </Button>
            <Link to="/setup">
              <Button size="sm">🔄 New Interview</Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Score + Hiring Suggestion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8"
        >
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Circular Score */}
            <div className="flex flex-col items-center gap-4">
              <CircularScore score={report.overallScore} size={180} />
              <p className="text-slate-400 text-sm">Overall Score</p>
            </div>

            {/* Summary + Hiring Suggestion */}
            <div className="flex-1 space-y-5">
              {/* Hiring Suggestion Banner */}
              <div className={`${hireColorClass} rounded-xl p-4 text-center`}>
                <p className="text-white font-bold text-lg">{report.hiringSuggestion}</p>
                <p className="text-white/80 text-sm">Hiring Recommendation</p>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{report.summary}</p>
            </div>

            {/* Radar Chart */}
            <div className="w-full lg:w-64">
              <RadarChart scores={report.scores} />
            </div>
          </div>
        </motion.div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ScoreCard label="Communication" score={report.scores?.communication} icon="💬" delay={0.1} />
          <ScoreCard label="Technical" score={report.scores?.technicalKnowledge} icon="⚙️" delay={0.2} />
          <ScoreCard label="Problem Solving" score={report.scores?.problemSolving} icon="🧩" delay={0.3} />
          <ScoreCard label="Behavioral" score={report.scores?.behavioralSkills} icon="🤝" delay={0.4} />
        </div>

        {/* Feedback Sections */}
        <FeedbackSection
          strengths={report.strengths}
          improvements={report.improvements}
          detailedFeedback={report.detailedFeedback}
        />

        {/* Recommended Resources */}
        {report.recommendedResources?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h3 className="text-white font-semibold">Recommended Resources</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.recommendedResources.map((r, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 space-y-1">
                  <p className="text-blue-400 text-xs font-medium uppercase tracking-wide">{r.topic}</p>
                  <p className="text-slate-300 text-sm">{r.resource}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link to="/dashboard" className="flex-1">
            <Button variant="secondary" fullWidth>← Back to Dashboard</Button>
          </Link>
          <Link to="/setup" className="flex-1">
            <Button fullWidth>Practice Again 🚀</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
