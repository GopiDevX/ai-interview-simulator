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

  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [activityMap, setActivityMap] = useState({})

  useEffect(() => {
    let totalXp = sessions.length * 50 // Base XP per session
    const map = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    sessions.forEach(s => {
      if (s.status === 'completed') totalXp += 50
      const date = new Date(s.startedAt)
      date.setHours(0, 0, 0, 0)
      const dateString = date.toISOString().split('T')[0]
      map[dateString] = (map[dateString] || 0) + 1
    })
    
    setXp(totalXp)
    setActivityMap(map)
    
    let currentStreak = 0
    let checkDate = new Date(today)
    
    const todayStr = checkDate.toISOString().split('T')[0]
    if (map[todayStr]) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      checkDate.setDate(checkDate.getDate() - 1)
      const yesterdayStr = checkDate.toISOString().split('T')[0]
      if (map[yesterdayStr]) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }
    
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0]
      if (map[dStr]) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    setStreak(currentStreak)
  }, [sessions])

  const generateHeatmapDays = () => {
    const days = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        count: activityMap[dateStr] || 0
      })
    }
    return days
  }

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
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              Welcome back, <span className="text-electric-cyan">{user?.name?.split(' ')[0]}</span> 👋
              {user?.tier === 'pro' && (
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs px-2 py-1 rounded-md tracking-wider font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]">PRO</span>
              )}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-400 font-medium">Track your interview practice progress</p>
              {user?.tier !== 'pro' && (
                <Link to="/pricing" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                  ⚡ Upgrade to Pro
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={async () => {
                try {
                  await import('../api/auth.js').then(m => m.default.post('/admin/promote'))
                  toast.success('Promoted to Recruiter! Please log out and back in.')
                } catch (e) {
                  toast.error('Failed to promote')
                }
              }}
              className="px-6 py-3 bg-white/5 border border-amber-500/30 text-amber-500 rounded-xl font-semibold text-sm transition-all hover:bg-amber-500/10"
            >
              🛠 Promote to Recruiter (Test)
            </button>
            <Link to="/matchmaking">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
              >
                <span className="text-lg">🤝</span>
                Live P2P Practice
              </motion.button>
            </Link>
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
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { label: 'Total Sessions', value: stats.total, icon: '🎯', color: 'from-blue-600 to-blue-400' },
            { label: 'Completed', value: stats.completed, icon: '✅', color: 'from-emerald-500 to-green-400' },
            { label: 'Current Streak', value: `${streak} Days`, icon: '🔥', color: 'from-orange-500 to-amber-400' },
            { label: 'Total XP', value: xp, icon: '⭐', color: 'from-purple-500 to-pink-400' },
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
              <div className="text-3xl sm:text-4xl font-display font-bold text-white tabular-nums">{stat.value}</div>
              <div className="text-slate-400 font-medium text-sm mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Left Column: Gamification */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Heatmap */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-display font-bold text-white mb-4">Activity (Last 30 Days)</h2>
              <div className="flex flex-wrap gap-2">
                {generateHeatmapDays().map((day, i) => (
                  <div
                    key={i}
                    title={`${day.count} sessions on ${day.date}`}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md transition-all duration-300 ${
                      day.count === 0 ? 'bg-white/5 hover:bg-white/10' :
                      day.count === 1 ? 'bg-blue-900/60 shadow-[0_0_8px_rgba(30,58,138,0.5)]' :
                      day.count === 2 ? 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.6)]' :
                      'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-display font-bold text-white mb-4">Achievements</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'First Step', desc: 'Complete 1 interview', icon: '🐣', unlocked: stats.completed >= 1 },
                  { name: 'Dedicated', desc: 'Reach 3-day streak', icon: '🔥', unlocked: streak >= 3 },
                  { name: 'Veteran', desc: 'Complete 5 interviews', icon: '🛡️', unlocked: stats.completed >= 5 },
                  { name: 'Grinder', desc: 'Reach 1000 XP', icon: '💎', unlocked: xp >= 1000 },
                ].map((badge, i) => (
                  <div key={i} className={`flex flex-col items-center text-center p-3 rounded-xl border ${badge.unlocked ? 'border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/5 bg-white/5 opacity-50 grayscale'}`}>
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <div className={`font-bold text-sm ${badge.unlocked ? 'text-amber-400' : 'text-slate-400'}`}>{badge.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{badge.desc}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Sessions */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-display font-bold text-white mb-6">Recent Interviews</h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : sessions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-8 text-center border-dashed border-2 border-white/10"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎤</span>
                </div>
                <h3 className="text-white font-bold mb-2">No interviews yet</h3>
                <Link to="/setup">
                  <button className="px-6 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm mt-4 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all">
                    Start One →
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
                    className="glass-card p-4 card-hover flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate text-sm">{session.role}</p>
                      <p className="text-slate-400 text-xs">{session.company} · {timeAgo(session.startedAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge variant={statusColors[session.status] || 'slate'}>
                        {session.status}
                      </Badge>
                      {session.status === 'completed' ? (
                        <Link to={`/report/${session.sessionId}`}>
                          <button className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
                            Report →
                          </button>
                        </Link>
                      ) : session.status === 'active' ? (
                        <Link to={`/interview/${session.sessionId}`}>
                          <button className="text-green-400 hover:text-green-300 text-xs font-medium transition-colors">
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
    </div>
  )
}
