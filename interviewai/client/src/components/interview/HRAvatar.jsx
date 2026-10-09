import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const HR_PERSONAS = [
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    title: 'Lead Talent Acquisition Partner',
    company: 'Enterprise Cloud & Systems',
    image: '/avatars/sarah.jpg',
    gender: 'female',
    accent: 'US Professional (Warm & Articulate)',
    bio: '10+ years recruiting software architects and senior engineers at Fortune 500 tech companies.'
  },
  {
    id: 'david',
    name: 'David Chen',
    title: 'Director of Engineering Talent',
    company: 'Scale-up & Systems Engineering',
    image: '/avatars/david.jpg',
    gender: 'male',
    accent: 'US Professional (Analytical & Engaging)',
    bio: 'Former senior engineering manager turned talent director, specializes in deep technical & cultural assessment.'
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    title: 'Staff Technical Recruiter',
    company: 'Global Software Innovation',
    image: '/avatars/priya.jpg',
    gender: 'female',
    accent: 'Global Professional (Empathetic & Thorough)',
    bio: 'Expert in behavioral STAR evaluations and full-stack competency evaluation across global tech hubs.'
  }
]

export default function HRAvatar({
  isSpeaking = false,
  isCandidateTyping = false,
  isEvaluating = false,
  stage = 'intro',
  company = 'Enterprise Corp',
  selectedPersona = 'sarah',
  onSelectPersona,
  onRepeatAudio
}) {
  const [activePersona, setActivePersona] = useState(
    HR_PERSONAS.find(p => p.id === selectedPersona) || HR_PERSONAS[0]
  )
  const [soundBars, setSoundBars] = useState([35, 60, 25, 80, 50, 95, 40, 75, 30, 65, 85, 45, 70, 30, 60, 40, 65])
  const [humanAction, setHumanAction] = useState({
    status: 'attentive',
    label: 'Direct Eye Contact & Active Listening',
    icon: '👀',
    noteText: 'Reviewing candidate responses in real-time...'
  })

  useEffect(() => {
    const found = HR_PERSONAS.find(p => p.id === selectedPersona)
    if (found) setActivePersona(found)
  }, [selectedPersona])

  // Real human interactive behavioral state machine
  useEffect(() => {
    if (isSpeaking) {
      setHumanAction({
        status: 'speaking',
        label: 'Asking Question & Explaining Context',
        icon: '🗣️',
        noteText: `Delivering ${stage.toUpperCase()} evaluation question...`
      })
    } else if (isEvaluating) {
      setHumanAction({
        status: 'evaluating',
        label: 'Analyzing STAR & Technical Depth',
        icon: '✍️',
        noteText: 'Taking recruiter notes and calibrating score...'
      })
    } else if (isCandidateTyping) {
      setHumanAction({
        status: 'listening_nod',
        label: 'Attentive Listening & Nodding',
        icon: '📝',
        noteText: 'Candidate is presenting response...'
      })
    } else {
      setHumanAction({
        status: 'idle_observing',
        label: 'Awaiting Candidate Explanation',
        icon: '🤝',
        noteText: 'Observing articulation, clarity and posture...'
      })
    }
  }, [isSpeaking, isCandidateTyping, isEvaluating, stage])

  // Soundwave animation when AI speaks
  useEffect(() => {
    if (!isSpeaking) {
      setSoundBars(prev => prev.map(() => 12))
      return
    }
    const interval = setInterval(() => {
      setSoundBars(prev => prev.map(() => Math.floor(Math.random() * 80) + 20))
    }, 85)
    return () => clearInterval(interval)
  }, [isSpeaking])

  return (
    <div className="w-full h-full relative flex flex-col lg:flex-row items-center justify-between overflow-hidden bg-gradient-to-b from-[#060A14] via-[#0D1527] to-[#060A14] p-4 lg:px-8 select-none gap-4">
      
      {/* Background Ambience / Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-indigo-900/20 pointer-events-none" />

      {/* Left: HR Profile & Corporate Credentials */}
      <div className="relative z-10 flex flex-col items-start max-w-sm w-full lg:w-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-blue-500/10 border border-blue-400/40 text-blue-400 uppercase">
            Official IT HR Interviewer
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Voice & Video Active
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {activePersona.name}
        </h2>
        <p className="text-sm text-slate-300 font-medium mt-0.5">{activePersona.title}</p>
        <p className="text-xs text-blue-400 font-mono mt-1">{company || activePersona.company}</p>

        {/* Action controls & persona switch */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {onSelectPersona && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-[10px] text-slate-400 font-medium px-2">Interviewer:</span>
              {HR_PERSONAS.map(persona => (
                <button
                  key={persona.id}
                  onClick={() => {
                    setActivePersona(persona)
                    onSelectPersona(persona.id)
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-semibold ${
                    activePersona.id === persona.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={`${persona.name} (${persona.title})`}
                >
                  <img
                    src={persona.image}
                    alt={persona.name}
                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                  />
                  <span>{persona.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}

          {onRepeatAudio && (
            <button
              onClick={onRepeatAudio}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-white/10 flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title="Repeat HR's voice question"
            >
              <span>🔊</span>
              <span>Repeat Question</span>
            </button>
          )}
        </div>
      </div>

      {/* Center: Large Interactive Animated Human Video Frame */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative group">
          
          {/* Active Speaking & Action Ambient Studio Halo */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.03, 1] : humanAction.status === 'listening_nod' ? [1, 1.015, 1] : 1,
              opacity: isSpeaking ? [0.65, 0.95, 0.65] : 0.25
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className={`absolute -inset-2.5 rounded-3xl blur-xl transition-all ${
              isSpeaking
                ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400'
                : humanAction.status === 'listening_nod'
                ? 'bg-emerald-500/30'
                : 'bg-slate-700/30'
            }`}
          />

          {/* Sizable Video Frame (Expansive 50vh prominence) */}
          <div className="relative w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-3xl overflow-hidden border-2 border-white/20 bg-slate-950 shadow-2xl">
            
            {/* Photorealistic High-Definition HR Video Stream with Human Physics */}
            <motion.div
              animate={{
                // Natural human nodding when candidate is typing or HR is speaking
                y: isSpeaking 
                  ? [0, -3, 1, -2, 0] 
                  : humanAction.status === 'listening_nod' 
                  ? [0, 4, 1, 3, 0] 
                  : humanAction.status === 'evaluating'
                  ? [0, 5, 4, 5, 0]
                  : [0, -1, 0],
                // Subtle human posture shift
                x: isSpeaking ? [0, 1.5, -1.5, 0] : 0,
                scale: isSpeaking ? [1, 1.02, 0.995, 1.015, 1] : [1, 1.008, 1]
              }}
              transition={{
                duration: isSpeaking ? 0.9 : humanAction.status === 'listening_nod' ? 2.5 : 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-full h-full relative"
            >
              <img
                src={activePersona.image}
                alt={activePersona.name}
                className="w-full h-full object-cover object-top filter brightness-105 contrast-[1.03]"
              />

              {/* Dynamic Speaking Illumination Glow */}
              {isSpeaking && (
                <motion.div
                  animate={{ opacity: [0.15, 0.5, 0.25, 0.55, 0.15] }}
                  transition={{ duration: 0.75, repeat: Infinity }}
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/30 via-transparent to-transparent pointer-events-none"
                />
              )}
            </motion.div>

            {/* Top In-Frame Live Recruiter Action Watermark */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-[11px] text-slate-100 shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${
                isSpeaking ? 'bg-red-500 animate-ping' :
                humanAction.status === 'listening_nod' ? 'bg-emerald-400 animate-pulse' :
                humanAction.status === 'evaluating' ? 'bg-amber-400' : 'bg-blue-400'
              }`} />
              <span className="font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span>{humanAction.icon}</span>
                <span>{isSpeaking ? 'HR SPEAKING' : humanAction.label}</span>
              </span>
            </div>

            {/* Bottom In-Frame Recruiter Card */}
            <div className="absolute bottom-3 left-3 right-3 px-3.5 py-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/10 flex items-center justify-between shadow-2xl">
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-white">{activePersona.name}</span>
                <span className="text-[10px] text-slate-300 font-medium">{activePersona.title}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Live 1080p
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Voice Waveform Equalizer */}
        <div className="mt-3.5 flex items-center gap-1.5 h-9 px-5 py-2 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-xl">
          <span className="text-[10px] text-slate-400 font-mono mr-1.5 font-bold">HR AUDIO:</span>
          {soundBars.map((height, idx) => (
            <motion.div
              key={idx}
              animate={{ height: isSpeaking ? `${height}%` : '15%' }}
              transition={{ duration: 0.08 }}
              className={`w-1 rounded-full transition-colors ${
                isSpeaking
                  ? 'bg-gradient-to-t from-blue-500 to-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right: Live HR Recruiter Real-Time Action Log */}
      <div className="relative z-10 flex flex-col items-end max-w-sm w-full lg:w-auto text-right">
        <div className="px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl backdrop-blur-md w-full space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Live Recruiter Feed</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
              STAR Rubric
            </span>
          </div>
          
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Current Action:</span>
            <p className="text-sm font-semibold text-white flex items-center justify-end gap-1.5">
              <span>{humanAction.icon}</span>
              <span>{humanAction.label}</span>
            </p>
          </div>

          <p className="text-xs text-cyan-300 font-medium leading-relaxed italic bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
            "{humanAction.noteText}"
          </p>
          
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Interview Stage:</span>
            <strong className="text-cyan-400 uppercase font-mono">{stage}</strong>
          </div>
        </div>
      </div>

    </div>
  )
}
