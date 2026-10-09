import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  
  // Real human motion states
  const [mouthOpen, setMouthOpen] = useState(0) // 0 to 1
  const [jawDrop, setJawDrop] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0, rotate: 0 })
  const [soundBars, setSoundBars] = useState([35, 60, 25, 80, 50, 95, 40, 75, 30, 65, 85, 45, 70, 30, 60])
  const [hrActionText, setHrActionText] = useState('Attentively listening & observing...')

  const animFrameRef = useRef(null)
  const speechIntervalRef = useRef(null)

  useEffect(() => {
    const found = HR_PERSONAS.find(p => p.id === selectedPersona)
    if (found) setActivePersona(found)
  }, [selectedPersona])

  // 1. Natural Human Eye Blinking Physics (Every 3 to 6 seconds with occasional double-blink)
  useEffect(() => {
    let blinkTimeout
    const scheduleNextBlink = () => {
      const delay = Math.random() * 3500 + 2500
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true)
        setTimeout(() => {
          setIsBlinking(false)
          // 25% chance of realistic double-blink
          if (Math.random() < 0.25) {
            setTimeout(() => {
              setIsBlinking(true)
              setTimeout(() => {
                setIsBlinking(false)
                scheduleNextBlink()
              }, 120)
            }, 100)
          } else {
            scheduleNextBlink()
          }
        }, 140)
      }, delay)
    }

    scheduleNextBlink()
    return () => clearTimeout(blinkTimeout)
  }, [])

  // 2. Realistic Dynamic Lip-Sync & Viseme Mouth Movement while Speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0)
      setJawDrop(0)
      setSoundBars(prev => prev.map(() => 15))
      return
    }

    // High frequency phoneme modulation
    const updateLipSync = () => {
      // Simulate viseme phonemes (A, E, O, M, P shapes)
      const targetMouth = Math.random() > 0.15 ? Math.random() * 0.85 + 0.15 : 0.05
      const targetJaw = targetMouth * 6
      setMouthOpen(targetMouth)
      setJawDrop(targetJaw)
      setSoundBars(prev => prev.map(() => Math.floor(Math.random() * 75) + 20))
    }

    speechIntervalRef.current = setInterval(updateLipSync, 90)

    return () => {
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current)
    }
  }, [isSpeaking])

  // 3. Natural Human Head Movements (Attentive Nodding & Micro-Saccades)
  useEffect(() => {
    let moveTimeout
    const scheduleHeadMotion = () => {
      const delay = isSpeaking ? Math.random() * 1200 + 600 : Math.random() * 3000 + 1500
      moveTimeout = setTimeout(() => {
        if (isSpeaking) {
          // Subtle cadence nodding while speaking
          setHeadTilt({
            x: (Math.random() - 0.5) * 3,
            y: (Math.random() - 0.5) * 4 + 1,
            rotate: (Math.random() - 0.5) * 2.5
          })
        } else {
          // Attentive listening tilt
          setHeadTilt({
            x: (Math.random() - 0.5) * 2,
            y: Math.random() * 2 - 1,
            rotate: (Math.random() - 0.5) * 3
          })
        }
        scheduleHeadMotion()
      }, delay)
    }

    scheduleHeadMotion()
    return () => clearTimeout(moveTimeout)
  }, [isSpeaking])

  // Dynamic HR thought/action status based on stage and speaking state
  useEffect(() => {
    if (isSpeaking) {
      const speakingPhrases = [
        'Explaining interview question and technical context...',
        'Providing evaluation criteria & expectations...',
        'Directing conversation to architectural considerations...',
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

  return (
    <div className="w-full h-full relative flex flex-col md:flex-row items-center justify-between overflow-hidden bg-gradient-to-b from-[#090D16] via-[#0F172A] to-[#090D16] p-4 md:px-8 select-none">
      
      {/* Background Ambience / Subtle Corporate Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-indigo-900/10 pointer-events-none" />

      {/* Left: HR Profile & Recruiter Credentials */}
      <div className="relative z-10 flex flex-col items-start max-w-sm mb-3 md:mb-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-blue-500/10 border border-blue-400/30 text-blue-400 uppercase">
            Original IT HR Interviewer
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live AI Human Video
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          {activePersona.name}
        </h2>
        <p className="text-xs text-slate-400 font-medium">{activePersona.title}</p>
        <p className="text-xs text-blue-400 font-mono mt-0.5">{company || activePersona.company}</p>

        {/* HR Persona Switcher */}
        {onSelectPersona && (
          <div className="mt-3 flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-white/10 shadow-inner">
            <span className="text-[10px] text-slate-400 font-medium px-2">Recruiter:</span>
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

      {/* Center: Realistic Animated Talking Human HR Feed */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative group">
          
          {/* Active Speaking Ambient Glow */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.04, 1] : 1,
              opacity: isSpeaking ? [0.6, 0.95, 0.6] : 0.2
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className={`absolute -inset-1.5 rounded-2xl blur-md transition-all ${
              isSpeaking
                ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400'
                : 'bg-slate-700/30'
            }`}
          />

          {/* Main Video Frame */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-950 shadow-2xl">
            
            {/* Animated Human Head Layer with Micro-Saccade & Head Movement Physics */}
            <motion.div
              animate={{
                x: headTilt.x,
                y: headTilt.y,
                rotate: headTilt.rotate,
                scale: isSpeaking ? [1, 1.015, 0.995, 1.01, 1] : [1, 1.006, 1]
              }}
              transition={{
                duration: isSpeaking ? 0.6 : 2.5,
                ease: 'easeInOut'
              }}
              className="w-full h-full relative"
            >
              {/* Photorealistic High-Definition HR Base Video Frame */}
              <img
                src={activePersona.image}
                alt={activePersona.name}
                className="w-full h-full object-cover object-top filter brightness-105 contrast-[1.03]"
              />

              {/* Realistic Animated Mouth & Viseme Layer */}
              {isSpeaking && (
                <div 
                  className="absolute inset-x-0 bottom-[18%] mx-auto w-[24%] flex items-center justify-center pointer-events-none"
                  style={{ transform: `translateY(${jawDrop * 0.4}px)` }}
                >
                  {/* Dynamic Lip Opening Mask */}
                  <motion.div
                    animate={{
                      scaleY: mouthOpen > 0 ? mouthOpen * 1.6 + 0.3 : 0.1,
                      scaleX: mouthOpen > 0.4 ? 1.08 : 0.95,
                      opacity: mouthOpen > 0 ? 0.9 : 0
                    }}
                    transition={{ duration: 0.08 }}
                    className="w-full h-3 rounded-full bg-gradient-to-b from-[#2a0e14] via-[#451821] to-[#1a080c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] border-t border-[#7a2e3b]/50"
                  >
                    {/* Subtle Teeth / Viseme Light Reflection */}
                    {mouthOpen > 0.45 && (
                      <div className="w-[60%] h-0.5 mx-auto bg-white/70 rounded-full mt-0.5 shadow-sm" />
                    )}
                  </motion.div>
                </div>
              )}

              {/* Realistic Human Eye Blink Overlay */}
              <AnimatePresence>
                {isBlinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.95 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.05 }}
                    className="absolute inset-x-0 top-[26%] mx-auto w-[46%] h-[5%] flex justify-between items-center pointer-events-none px-1"
                  >
                    <div className="w-[42%] h-full rounded-full bg-[#8a6857]/90 shadow-inner border-b border-black/40" />
                    <div className="w-[42%] h-full rounded-full bg-[#8a6857]/90 shadow-inner border-b border-black/40" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Speech Illumination Glow */}
              {isSpeaking && (
                <motion.div
                  animate={{ opacity: [0.15, 0.4, 0.2, 0.45, 0.15] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/20 via-transparent to-transparent pointer-events-none"
                />
              )}
            </motion.div>

            {/* In-Frame Live Recruiter Watermark */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-slate-200">
              <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
              <span className="font-semibold tracking-wider uppercase">
                {isSpeaking ? 'LIVE HR SPEAKING' : 'HR OBSERVING'}
              </span>
            </div>

            {/* In-Frame HR ID Tag */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white">{activePersona.name}</span>
                <span className="text-[9px] text-slate-400">{activePersona.title}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Video
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Voice Waveform */}
        <div className="mt-3 flex items-center gap-1.5 h-8 px-4 py-1.5 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-lg">
          <span className="text-[10px] text-slate-400 font-mono mr-1">HR VOICE:</span>
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

      {/* Right: Live HR Recruiter Analysis HUD */}
      <div className="relative z-10 flex flex-col items-end max-w-xs mt-3 md:mt-0 text-right">
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 shadow-lg backdrop-blur-md w-full">
          <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="font-semibold text-slate-300">Recruiter Decision Engine</span>
          </div>
          <p className="text-xs text-cyan-300 font-medium leading-relaxed italic">
            "{hrActionText}"
          </p>
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Framework: <strong className="text-slate-200">STAR Method</strong></span>
            <span>Current Focus: <strong className="text-slate-200">{stage.toUpperCase()}</strong></span>
          </div>
        </div>
      </div>

    </div>
  )
}
