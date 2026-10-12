import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/ui/Button.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e, customEmail, customPassword) => {
    if (e && e.preventDefault) e.preventDefault()
    const targetEmail = (customEmail !== undefined ? customEmail : email).trim().toLowerCase()
    const targetPassword = customPassword !== undefined ? customPassword : password

    if (!targetEmail || !targetPassword) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await login(targetEmail, targetPassword)
      toast.success('Welcome back! 👋')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    handleSubmit(null, demoEmail, demoPassword)
  }

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-4 pt-16 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-4"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center glow-blue-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to continue your interview practice</p>
        </div>

        {/* 1-Click Quick Demo Access */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/20 backdrop-blur-md space-y-2.5">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider text-center">
            ⚡ Quick 1-Click Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('student1@campus.edu', 'CampusUser@2026')}
              className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium transition-all text-left"
            >
              🎓 Student Demo
              <span className="block text-[10px] text-slate-400 font-normal">student1@campus.edu</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('alumni.google@campus.edu', 'CampusUser@2026')}
              className="p-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-medium transition-all text-left"
            >
              🤝 Alumni Demo
              <span className="block text-[10px] text-slate-400 font-normal">Google SDE-2</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('demo@example.com', 'password123')}
              className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium transition-all text-left"
            >
              👤 Candidate Demo
              <span className="block text-[10px] text-slate-400 font-normal">demo@example.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('recruiter@example.com', 'password123')}
              className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium transition-all text-left"
            >
              💼 Recruiter Demo
              <span className="block text-[10px] text-slate-400 font-normal">recruiter@example.com</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
