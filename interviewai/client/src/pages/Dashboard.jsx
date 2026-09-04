import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { interviewApi } from '../api/interview.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Loader, { SkeletonCard } from '../components/ui/Loader.jsx'
import { timeAgo, getScoreBg } from '../utils/helpers.js'
import toast from 'react-hot-toast'

const statusColors = {
  active: 'blue',
  completed: 'green',
  abandoned: 'slate'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    interviewApi.getUserSessions()
      .then(({ data }) => setSessions(data))
      .catch(() => toast.error('Could not load sessions'))
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    active: sessions.filter(s => s.status === 'active').length,
  }

  return (
    <div className="min-h-screen hero-bg pt-20 px-4 pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">
              Good to see you, <span className="text-blue-400">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-slate-400 mt-1">Track your interview practice progress</p>
          </div>
          <Link to="/setup">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-all glow-blue-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Interview
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Sessions', value: stats.total, icon: '🎯' },
            { label: 'Completed', value: stats.completed, icon: '✅' },
            { label: 'In Progress', value: stats.active, icon: '⚡' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 text-center"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-white tabular-nums">{stat.value}</div>
              <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Sessions */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent Interviews</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-16 text-center"
            >
              <div className="text-5xl mb-4">🎤</div>
              <h3 className="text-white font-semibold text-lg mb-2">No interviews yet</h3>
              <p className="text-slate-400 mb-6">Start your first AI-powered mock interview to see your progress here.</p>
              <Link to="/setup">
                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all">
                  Start Your First Interview →
                </button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, i) => (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-card p-5 card-hover flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-lg flex-shrink-0">
                      💼
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{session.role}</p>
                      <p className="text-slate-400 text-sm">{session.company} · {timeAgo(session.startedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant={statusColors[session.status] || 'slate'}>
                      {session.status}
                    </Badge>
                    {session.status === 'completed' ? (
                      <Link to={`/report/${session.sessionId}`}>
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                          View Report →
                        </button>
                      </Link>
                    ) : session.status === 'active' ? (
                      <Link to={`/interview/${session.sessionId}`}>
                        <button className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
                          Continue →
                        </button>
                      </Link>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
