import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export const HR_PERSONAS = [
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    title: 'Lead Talent Acquisition Partner',
    company: 'Enterprise Cloud & Systems',
    image: '/avatars/sarah.jpg',
    gender: 'female',
    accent: 'US Professional (Warm & Direct)',
    bio: '10+ years recruiting software architects and senior engineers at Fortune 500 tech companies.'
  },
  {
    id: 'david',
    name: 'David Chen',
    title: 'Director of Engineering Talent',
    company: 'Scale-up & Systems Engineering',
    image: '/avatars/david.jpg',
    gender: 'male',
    accent: 'US Professional (Engaging & Analytical)',
    bio: 'Former senior engineering manager turned talent director, specializes in deep technical & cultural assessment.'
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    title: 'Staff Technical Recruiter',
    company: 'Global Software Innovation',
    image: '/avatars/priya.jpg',
    gender: 'female',
    accent: 'Global Professional (Articulate & Thorough)',
    bio: 'Expert in behavioral STAR evaluations and full-stack competency evaluation across global tech hubs.'
  }
]

export default function HRAvatar({
  isSpeaking = false,
  stage = 'intro',
  company = 'Enterprise Corp',
  selectedPersona = 'sarah',
  onSelectPersona
}) {
  const [activePersona, setActivePersona] = useState(
    HR_PERSONAS.find(p => p.id === selectedPersona) || HR_PERSONAS[0]
  )
  const [soundBars, setSoundBars] = useState([35, 60, 25, 80, 50, 95, 40, 75, 30, 65, 85, 45, 70, 30, 60, 40, 65])
  const [hrActionText, setHrActionText] = useState('Attentively listening & observing...')

  useEffect(() => {
    const found = HR_PERSONAS.find(p => p.id === selectedPersona)
    if (found) setActivePersona(found)
  }, [selectedPersona])

  // Dynamic HR thought/action status based on stage and speaking state
  useEffect(() => {
    if (isSpeaking) {
      const speakingPhrases = [
        'Explaining interview question and technical context...',
        'Providing evaluation criteria & expectations...',
        'Guiding candidate through architectural design discussion...',
        'Clarifying expected trade-offs and impact...'
      ]
      setHrActionText(speakingPhrases[Math.floor(Math.random() * speakingPhrases.length)])
    } else {
      if (stage === 'intro') {
        setHrActionText('Reviewing candidate resume & career trajectory...')
      } else if (stage === 'technical') {
        setHrActionText('Analyzing technical depth, system trade-offs & clarity...')
      } else if (stage === 'behavioral') {
        setHrActionText('Evaluating STAR framework adherence (Situation, Task, Action, Result)...')
      } else if (stage === 'coding') {
        setHrActionText('Reviewing algorithmic complexity & edge cases...')
      } else {
        setHrActionText('Active listening & taking recruiter notes...')
      }
    }
  }, [isSpeaking, stage])

  // Soundwave animation when AI speaks
  useEffect(() => {
    if (!isSpeaking) {
      setSoundBars(prev => prev.map(() => 15))
      return
    }
    const interval = setInterval(() => {
      setSoundBars(prev => prev.map(() => Math.floor(Math.random() * 75) + 20))
    }, 90)
    return () => clearInterval(interval)
  }, [isSpeaking])

  return (
    <div className="w-full h-full relative flex flex-col lg:flex-row items-center justify-between overflow-hidden bg-gradient-to-b from-[#080D1A] via-[#0F172A] to-[#080D1A] p-4 lg:px-8 select-none gap-4">
      
      {/* Background Ambience / Clean Corporate Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/15 via-transparent to-indigo-900/15 pointer-events-none" />

      {/* Left: HR Profile & Corporate Credentials */}
      <div className="relative z-10 flex flex-col items-start max-w-sm w-full lg:w-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-blue-500/10 border border-blue-400/40 text-blue-400 uppercase">
            Official IT HR Interviewer
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live HD Feed
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {activePersona.name}
        </h2>
        <p className="text-sm text-slate-300 font-medium mt-0.5">{activePersona.title}</p>
        <p className="text-xs text-blue-400 font-mono mt-1">{company || activePersona.company}</p>

        {/* HR Persona Switcher Buttons */}
        {onSelectPersona && (
          <div className="mt-4 flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-lg">
            <span className="text-[10px] text-slate-400 font-medium px-2">Recruiter:</span>
            {HR_PERSONAS.map(persona => (
              <button
                key={persona.id}
                onClick={() => {
                  setActivePersona(persona)
                  onSelectPersona(persona.id)
                }}
                className={`text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 font-semibold ${
                  activePersona.id === persona.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={`${persona.name} (${persona.title})`}
              >
                <img
                  src={persona.image}
                  alt={persona.name}
                  className="w-5 h-5 rounded-full object-cover shadow-sm border border-white/20"
                />
                <span>{persona.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Large Cinematic Photorealistic HR Video Screen */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative group">
          
          {/* Active Speaking High-End Studio Ambient Glow */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.03, 1] : 1,
              opacity: isSpeaking ? [0.6, 0.95, 0.6] : 0.2
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className={`absolute -inset-2 rounded-3xl blur-lg transition-all ${
              isSpeaking
                ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400'
                : 'bg-slate-700/30'
            }`}
          />

          {/* Sizable Video Frame (Larger & Prominent) */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-3xl overflow-hidden border-2 border-white/20 bg-slate-950 shadow-2xl">
            
            {/* Photorealistic High-Definition HR Video Stream */}
            <motion.img
              src={activePersona.image}
              alt={activePersona.name}
              animate={{
                scale: isSpeaking ? [1, 1.02, 0.995, 1.015, 1] : [1, 1.008, 1],
                y: isSpeaking ? [0, -2, 1, -1, 0] : [0, -1, 0]
              }}
              transition={{
                duration: isSpeaking ? 0.8 : 3.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-full h-full object-cover object-top filter brightness-105 contrast-[1.03]"
            />

            {/* Dynamic Speaking Illumination Glow */}
            {isSpeaking && (
              <motion.div
                animate={{ opacity: [0.15, 0.45, 0.2, 0.5, 0.15] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/25 via-transparent to-transparent pointer-events-none"
              />
            )}

            {/* Top In-Frame Live Watermark */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] text-slate-200">
              <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
              <span className="font-bold tracking-wider uppercase">
                {isSpeaking ? 'LIVE HR SPEAKING' : 'HR OBSERVING'}
              </span>
            </div>

            {/* Bottom In-Frame Recruiter Card */}
            <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">{activePersona.name}</span>
                <span className="text-[10px] text-slate-400">{activePersona.title}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                1080p Video
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Voice Waveform Equalizer */}
        <div className="mt-3.5 flex items-center gap-1.5 h-8 px-5 py-1.5 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-lg">
          <span className="text-[10px] text-slate-400 font-mono mr-1">VOICE:</span>
          {soundBars.map((height, idx) => (
            <motion.div
              key={idx}
              animate={{ height: isSpeaking ? `${height}%` : '15%' }}
              transition={{ duration: 0.08 }}
              className={`w-1 rounded-full transition-colors ${
                isSpeaking
                  ? 'bg-gradient-to-t from-blue-500 to-cyan-300 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right: Recruiter Evaluation Status HUD */}
      <div className="relative z-10 flex flex-col items-end max-w-sm w-full lg:w-auto text-right">
        <div className="px-4 py-3 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg backdrop-blur-md w-full">
          <div className="flex items-center justify-end gap-2 text-xs text-slate-400 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="font-bold text-slate-200">Recruiter Evaluation Hub</span>
          </div>
          <p className="text-xs text-cyan-300 font-medium leading-relaxed italic">
            "{hrActionText}"
          </p>
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Method: <strong className="text-slate-200">STAR Framework</strong></span>
            <span>Stage: <strong className="text-slate-200">{stage.toUpperCase()}</strong></span>
          </div>
        </div>
      </div>

    </div>
  )
}
