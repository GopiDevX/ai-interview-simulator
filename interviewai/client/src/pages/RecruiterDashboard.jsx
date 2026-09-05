import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import api from '../api/auth' // use authorized api instance

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch all candidates and their aggregated stats
    api.get('/admin/candidates')
      .then(res => setCandidates(res.data))
      .catch(() => toast.error('Failed to load candidates'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen hero-bg pt-20 px-4 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-electric-cyan border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen hero-bg pt-24 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              Recruiter Dashboard
              <span className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-xs px-2 py-1 rounded-md tracking-wider font-black shadow-[0_0_10px_rgba(16,185,129,0.5)]">ADMIN</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Review candidate performance and AI scorecards</p>
          </div>
          
          <div className="glass-card px-6 py-3 flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Candidates</p>
              <p className="text-2xl font-bold text-white tabular-nums">{candidates.length}</p>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Interviews</p>
              <p className="text-2xl font-bold text-electric-cyan tabular-nums">
                {candidates.reduce((acc, curr) => acc + curr.totalSessions, 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider">Candidate</th>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider">Tier</th>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Interviews Completed</th>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Avg AI Score</th>
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {candidates.map((candidate) => (
                  <tr key={candidate._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                          {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-bold">{candidate.name}</p>
                          <p className="text-slate-400 text-xs">{candidate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        candidate.tier === 'pro' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {candidate.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                      {candidate.totalSessions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {candidate.avgScore > 0 ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-bold ${
                            candidate.avgScore >= 80 ? 'text-emerald-400' :
                            candidate.avgScore >= 60 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {candidate.avgScore}/100
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => toast('Detailed candidate view coming soon!', { icon: '🚧' })}
                        className="text-electric-cyan hover:text-white transition-colors font-bold text-sm bg-electric-cyan/10 hover:bg-electric-cyan/20 px-3 py-1.5 rounded-lg"
                      >
                        View Reports →
                      </button>
                    </td>
                  </tr>
                ))}
                
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No candidates found on the platform yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
