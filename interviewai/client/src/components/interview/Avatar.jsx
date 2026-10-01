import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function Avatar({ isSpeaking }) {
  const [soundBars, setSoundBars] = useState([40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 85, 50])

  // Animate soundwave bars when AI is speaking
  useEffect(() => {
    if (!isSpeaking) return
    const interval = setInterval(() => {
      setSoundBars(prev => prev.map(() => Math.floor(Math.random() * 70) + 20))
    }, 120)
    return () => clearInterval(interval)
  }, [isSpeaking])

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-[#0B1120] to-slate-950 p-6 select-none">
      {/* Ambient background glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className={`w-80 h-80 rounded-full border border-blue-500/20 ${isSpeaking ? 'animate-ping' : ''} duration-1000`} />
        <div className="absolute w-96 h-96 rounded-full border border-indigo-500/10 animate-pulse" />
        <div className="absolute w-64 h-64 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* Futuristic Holographic AI Core */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Outer Rotating Cyber Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-44 h-44 rounded-full border-2 border-dashed border-blue-400/30 flex items-center justify-center p-3"
        >
          {/* Inner Counter-Rotating Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full rounded-full border border-cyan-400/40 border-t-transparent border-b-transparent flex items-center justify-center"
          >
            {/* Pulsing Neural Orb */}
            <motion.div
              animate={{
                scale: isSpeaking ? [1, 1.08, 0.98, 1.05, 1] : [1, 1.02, 1],
                boxShadow: isSpeaking
                  ? '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(99, 102, 241, 0.3)'
                  : '0 0 20px rgba(59, 130, 246, 0.2)'
              }}
              transition={{ duration: isSpeaking ? 0.8 : 3, repeat: Infinity }}
              className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center relative overflow-hidden shadow-2xl"
            >
              {/* Internal Hologram Facets */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-black/40" />
              
              {/* AI Avatar Face Icon */}
              <div className="relative z-10 text-white flex flex-col items-center justify-center">
                <span className="text-4xl drop-shadow-md">🤖</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Live Audio Equalizer Waveform */}
        <div className="mt-8 flex items-center gap-1.5 h-10 px-4 py-2 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-lg">
          {soundBars.map((height, idx) => (
            <motion.div
              key={idx}
              animate={{ height: isSpeaking ? `${height}%` : '20%' }}
              transition={{ duration: 0.1 }}
              className={`w-1 rounded-full transition-colors ${
                isSpeaking
                  ? 'bg-gradient-to-t from-blue-500 to-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* AI Name & Status Pill */}
        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium">
          <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400 animate-ping' : 'bg-blue-400'}`} />
          <span className="text-slate-200 font-semibold">Alex</span>
          <span className="text-slate-500">·</span>
          <span className={isSpeaking ? 'text-cyan-400 font-medium' : 'text-slate-400'}>
            {isSpeaking ? 'Speaking...' : 'Listening & Analyzing...'}
          </span>
        </div>
      </div>
    </div>
  )
}
