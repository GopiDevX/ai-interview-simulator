import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'

export default function Matchmaking() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle') // idle, searching, found
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    // We only connect when the user clicks 'Find Partner'
    return () => {
      if (socket) socket.disconnect()
    }
  }, [socket])

  const handleFindPartner = () => {
    setStatus('searching')
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000')
    setSocket(newSocket)

    newSocket.on('connect', () => {
      newSocket.emit('find-partner', { userId: user?.id || 'guest', name: user?.name || 'Guest User' })
    })

    newSocket.on('partner-found', ({ roomId }) => {
      setStatus('found')
      // Small delay for UI effect before redirecting
      setTimeout(() => {
        // Disconnect from matchmaking socket, the PeerInterview page will create its own
        newSocket.disconnect()
        navigate(`/peer-interview/${roomId}`)
      }, 1500)
    })
  }

  const handleCancel = () => {
    if (socket) {
      socket.emit('cancel-find-partner')
      socket.disconnect()
    }
    setStatus('idle')
  }

  return (
    <div className="min-h-screen hero-bg pt-24 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-electric-blue/20 to-electric-purple/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <span className="text-5xl">🤝</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Live Peer Practice</h1>
          <p className="text-slate-400 mb-8">Match with another engineer to practice interviewing live with video and a shared whiteboard.</p>

          {status === 'idle' && (
            <button
              onClick={handleFindPartner}
              className="w-full py-4 bg-gradient-to-r from-electric-blue to-electric-cyan hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-bold text-lg transition-all glow-blue shadow-lg"
            >
              Find a Partner
            </button>
          )}

          {status === 'searching' && (
            <div className="space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-electric-cyan/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-electric-cyan rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-electric-cyan font-bold tracking-widest uppercase animate-pulse">Searching...</p>
              <button
                onClick={handleCancel}
                className="mt-4 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                Cancel Search
              </button>
            </div>
          )}

          {status === 'found' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-400 font-bold tracking-widest uppercase">Match Found!</p>
              <p className="text-slate-300 text-sm">Joining room...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
