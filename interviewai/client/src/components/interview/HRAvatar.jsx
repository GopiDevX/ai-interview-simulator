import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const HR_PERSONAS = [
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    title: 'Lead Talent Acquisition Partner',
    company: 'Enterprise Tech & Cloud Systems',
    image: '/avatars/sarah.jpg',
    voiceName: 'female',
    accent: 'US Professional (Warm & Direct)',
    bio: '10+ years recruiting software architects and senior engineers at Fortune 500 tech companies.'
  },
  {
    id: 'david',
    name: 'David Chen',
    title: 'Director of Engineering Talent',
    company: 'Scale-up & Systems Engineering',
    image: '/avatars/david.jpg',
    voiceName: 'male',
    accent: 'US Professional (Engaging & Analytical)',
    bio: 'Former senior engineering manager turned talent director, specializes in deep technical & cultural assessment.'
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    title: 'Staff Technical Recruiter',
    company: 'Global Software Innovation',
    image: '/avatars/priya.jpg',
    voiceName: 'female',
    accent: 'Global Professional (Articulate & Thorough)',
    bio: 'Expert in behavioral STAR evaluations and full-stack competency evaluation across global tech hubs.'
  }
]

export default function HRAvatar({ 
  isSpeaking = false, 
  stage = 'intro', 
  company = 'TechCorp',
  selectedPersona = 'sarah',
  onSelectPersona,
  proctoringStatus = { faceDetected: true, lookingAway: false }
}) {
  const [activePersona, setActivePersona] = useState(
    HR_PERSONAS.find(p => p.id === selectedPersona) || HR_PERSONAS[0]
  )
  const [soundBars, setSoundBars] = useState([35, 60, 25, 80, 50, 95, 40, 75, 30, 65, 85, 45, 70, 30, 60])
  const [hrActionText, setHrActionText] = useState('Attentively listening & observing...')

  useEffect(() => {
    const found = HR_PERSONAS.find(p => p.id === selectedPersona)
    if (found) setActivePersona(found)
  }, [selectedPersona])

  // Dynamic HR thought/action status based on stage and speaking state
  useEffect(() => {
    if (isSpeaking) {
      const speakingPhrases = [
        'Explaining interview question...',
        'Providing context & evaluation criteria...',
        'Clarifying technical expectations...',
        'Guiding candidate through discussion...'
      ]
      setHrActionText(speakingPhrases[Math.floor(Math.random() * speakingPhrases.length)])
    } else {
      if (stage === 'intro') {
        setHrActionText('Reviewing candidate profile & resume highlights...')
      } else if (stage === 'technical') {
        setHrActionText('Assessing architectural depth & technical precision...')
      } else if (stage === 'behavioral') {
        setHrActionText('Evaluating STAR framework adherence (Situation, Task, Action, Result)...')
      } else if (stage === 'coding') {
        setHrActionText('Reviewing algorithmic logic & edge case handling...')
      } else {
        setHrActionText('Active listening & taking structured notes...')
      }
    }
  }, [isSpeaking, stage])

  // Animate soundwave bars when AI is speaking
  useEffect(() => {
    if (!isSpeaking) return
    const interval = setInterval(() => {
      setSoundBars(prev => prev.map(() => Math.floor(Math.random() * 75) + 20))
    }, 100)
    return () => clearInterval(interval)
  }, [isSpeaking])

  return (
    <div className="w-full h-full relative flex flex-col md:flex-row items-center justify-between overflow-hidden bg-gradient-to-b from-[#0B1120] via-[#0F172A] to-[#0B1120] p-4 md:px-8 select-none">
      
      {/* Background Ambience / Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-indigo-900/10 pointer-events-none" />

      {/* Left: HR Profile & Corporate Badge */}
      <div className="relative z-10 flex flex-col items-start max-w-sm mb-3 md:mb-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-blue-500/10 border border-blue-400/30 text-blue-400 uppercase">
            Official IT HR Interviewer
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Verified Recruiter
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          {activePersona.name}
        </h2>
        <p className="text-xs text-slate-400 font-medium">{activePersona.title}</p>
        <p className="text-xs text-blue-400/80 font-mono mt-0.5">{company || activePersona.company}</p>

        {/* HR Persona Quick Switcher */}
        {onSelectPersona && (
          <div className="mt-3 flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-white/10 shadow-inner">
            <span className="text-[10px] text-slate-400 font-medium px-2">Interviewer:</span>
            {HR_PERSONAS.map(persona => (
              <button
                key={persona.id}
                onClick={() => {
                  setActivePersona(persona)
                  onSelectPersona(persona.id)
                }}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                  activePersona.id === persona.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={`${persona.name} (${persona.title})`}
              >
                <img
                  src={persona.image}
                  alt={persona.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span>{persona.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Photorealistic Animated HR Video Feed */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative group">
          {/* Active Speaking Glow Border */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.03, 1] : 1,
              opacity: isSpeaking ? [0.6, 0.9, 0.6] : 0.2
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`absolute -inset-1.5 rounded-2xl blur-md transition-all ${
              isSpeaking
                ? 'bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400'
                : 'bg-slate-700/40'
            }`}
          />

          {/* Main HR Video Screen Frame */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-950 shadow-2xl">
            {/* Photorealistic Portrait with breathing/listening motion */}
            <motion.img
              src={activePersona.image}
              alt={activePersona.name}
              animate={{
                scale: isSpeaking ? [1, 1.025, 0.995, 1.02, 1] : [1, 1.008, 1],
                y: isSpeaking ? [0, -2, 1, -1, 0] : [0, -1, 0]
              }}
              transition={{
                duration: isSpeaking ? 0.9 : 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-full h-full object-cover object-top filter brightness-105 contrast-[1.03]"
            />

            {/* Subtle Lip / Speech Dynamic Light Overlay */}
            {isSpeaking && (
              <motion.div
                animate={{ opacity: [0.1, 0.35, 0.15, 0.4, 0.1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/20 via-transparent to-transparent pointer-events-none"
              />
            )}

            {/* In-Frame Live Recruiter Watermark */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-slate-200">
              <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
              <span className="font-semibold tracking-wider uppercase">
                {isSpeaking ? 'LIVE SPEECH' : 'LISTENING'}
              </span>
            </div>

            {/* In-Frame HR ID Tag */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white">{activePersona.name}</span>
                <span className="text-[9px] text-slate-400">Talent Acquisition Lead</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                HD Feed
              </div>
            </div>
          </div>
        </div>

        {/* Live Audio Equalizer Waveform */}
        <div className="mt-3 flex items-center gap-1.5 h-8 px-4 py-1.5 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-lg">
          <span className="text-[10px] text-slate-400 font-mono mr-1">VOICE:</span>
          {soundBars.map((height, idx) => (
            <motion.div
              key={idx}
              animate={{ height: isSpeaking ? `${height}%` : '15%' }}
              transition={{ duration: 0.1 }}
              className={`w-1 rounded-full transition-colors ${
                isSpeaking
                  ? 'bg-gradient-to-t from-blue-500 to-cyan-300 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right: Live HR Evaluation Status HUD */}
      <div className="relative z-10 flex flex-col items-end max-w-xs mt-3 md:mt-0 text-right">
        <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 shadow-lg backdrop-blur-md w-full">
          <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="font-semibold text-slate-300">Recruiter Analysis HUD</span>
          </div>
          <p className="text-xs text-cyan-300 font-medium leading-relaxed italic">
            "{hrActionText}"
          </p>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Method: <strong className="text-slate-200">STAR Criteria</strong></span>
            <span>Focus: <strong className="text-slate-200">{stage.toUpperCase()}</strong></span>
          </div>
        </div>
      </div>

    </div>
  )
}
