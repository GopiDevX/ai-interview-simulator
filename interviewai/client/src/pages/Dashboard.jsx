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
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              Welcome back, <span className="text-electric-cyan">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Track your interview practice progress</p>
          </div>
          <Link to="/setup">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6, 182, 212, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 bg-gradient-to-r from-electric-blue to-electric-cyan text-white rounded-xl font-semibold text-sm transition-all glow-blue flex items-center gap-2 shadow-lg shadow-electric-blue/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Interview
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[
            { label: 'Total Sessions', value: stats.total, icon: '🎯', color: 'from-electric-blue to-electric-purple' },
            { label: 'Completed', value: stats.completed, icon: '✅', color: 'from-electric-emerald to-green-400' },
            { label: 'In Progress', value: stats.active, icon: '⚡', color: 'from-electric-cyan to-blue-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 relative overflow-hidden group hover:border-white/20 transition-colors"
            >
              <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`} />
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-4xl font-display font-bold text-white tabular-nums">{stat.value}</div>
              <div className="text-slate-400 font-medium text-sm mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Sessions */}
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-6">Recent Interviews</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-16 text-center border-dashed border-2 border-white/10"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-electric-blue/20 to-electric-cyan/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <span className="text-4xl">🎤</span>
              </div>
              <h3 className="text-white font-display font-bold text-xl mb-3">No interviews yet</h3>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto">Start your first AI-powered mock interview to see your progress here.</p>
              <Link to="/setup">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-navy-dark rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                >
                  Start Your First Interview →
                </motion.button>
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
