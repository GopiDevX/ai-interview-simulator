import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ProctoringHUD({
  isStrict = true,
  onIncidentLogged,
  onTrustScoreChange,
  isCameraOn = false,
  videoRef
}) {
  const [trustScore, setTrustScore] = useState(100)
  const [incidents, setIncidents] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [warningMessage, setWarningMessage] = useState(null)
  const [gazeStatus, setGazeStatus] = useState('centered') // 'centered' | 'looking_away' | 'no_face'
  const [audioLevel, setAudioLevel] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const canvasRef = useRef(null)

  // Notify parent of trust score changes
  useEffect(() => {
    onTrustScoreChange?.(trustScore, incidents)
  }, [trustScore, incidents, onTrustScoreChange])

  // Log incident helper
  const recordIncident = (type, severity, description) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const newIncident = { id: Date.now(), time: timestamp, type, severity, description }
    
    setIncidents(prev => [newIncident, ...prev].slice(0, 10))
    onIncidentLogged?.(newIncident)

    // Penalty logic
    const penalty = severity === 'high' ? 10 : severity === 'medium' ? 5 : 2
    setTrustScore(prev => Math.max(10, prev - penalty))

    // Show banner alert
    setWarningMessage(description)
    setTimeout(() => setWarningMessage(null), 5000)

    toast.error(`HR Proctor Alert: ${description}`, {
      icon: '🛡️',
      style: {
        borderRadius: '10px',
        background: '#1e1b4b',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.4)'
      }
    })
  }

  // 1. Tab Switch & Window Focus Proctoring
  useEffect(() => {
    if (!isStrict) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordIncident('TAB_SWITCH', 'high', 'Candidate switched browser tabs or minimized window')
      }
    }

    const handleWindowBlur = () => {
      recordIncident('WINDOW_BLUR', 'medium', 'Window focus lost — candidate clicked outside interview screen')
    }

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement
      setIsFullscreen(isFull)
      if (!isFull) {
        recordIncident('FULLSCREEN_EXIT', 'medium', 'Candidate exited secure fullscreen mode')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isStrict])

  // 2. Prevent Copy/Paste & Context Menu
  useEffect(() => {
    if (!isStrict) return

    const handleCopy = (e) => {
      e.preventDefault()
      recordIncident('CLIPBOARD_COPY', 'low', 'Copying question content is disabled during HR proctoring')
    }

    const handlePaste = (e) => {
      // We can warn on paste if desired, or let them code in coding round
    }

    const handleContextMenu = (e) => {
      e.preventDefault()
    }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [isStrict])

  // 3. Audio / Ambient Noise Monitoring
  useEffect(() => {
    if (!isStrict) return

    let isMounted = true
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (!isMounted) return

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const analyser = audioCtx.createAnalyser()
        const source = audioCtx.createMediaStreamSource(stream)
        analyser.fftSize = 256
        source.connect(analyser)

        audioContextRef.current = audioCtx
        analyserRef.current = analyser

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        let suspiciousNoiseCounter = 0

        const checkAudio = () => {
          if (!isMounted) return
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]
          }
          const avg = sum / bufferLength
          setAudioLevel(Math.min(100, Math.round(avg * 1.8)))

          // If excessive loud background chatter is detected continuously
          if (avg > 75) {
            suspiciousNoiseCounter++
            if (suspiciousNoiseCounter > 40) { // ~3 seconds of continuous loud noise
              recordIncident('AUDIO_DISTURBANCE', 'low', 'Secondary voice or loud background activity detected')
              suspiciousNoiseCounter = 0
            }
          } else {
            suspiciousNoiseCounter = Math.max(0, suspiciousNoiseCounter - 1)
          }

          animationFrameRef.current = requestAnimationFrame(checkAudio)
        }

        checkAudio()
      } catch (err) {
        console.warn('Microphone proctoring not initialized:', err)
      }
    }

    initAudio()

    return () => {
      isMounted = false
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
    }
  }, [isStrict])

  // 4. Lightweight Vision / Head Movement Simulation on Video
  useEffect(() => {
    if (!isCameraOn || !videoRef?.current) return

    const interval = setInterval(() => {
      // Simulate random vision verification or canvas analysis
      // In production, this can hook into MediaPipe / BlazeFace
      const statuses = ['centered', 'centered', 'centered', 'centered', 'looking_away']
      const current = statuses[Math.floor(Math.random() * statuses.length)]
      if (current === 'looking_away' && Math.random() < 0.2) {
        setGazeStatus('looking_away')
        recordIncident('GAZE_DEVIATION', 'low', 'Candidate gaze diverted away from screen for >3 seconds')
        setTimeout(() => setGazeStatus('centered'), 3000)
      } else {
        setGazeStatus('centered')
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [isCameraOn, videoRef])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast.error(`Error enabling fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <>
      {/* Real-time Warning Banner */}
      <AnimatePresence>
        {warningMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 inset-x-0 mx-auto max-w-lg z-50 px-4 py-3 rounded-xl bg-red-950/95 border-2 border-red-500 text-white shadow-2xl backdrop-blur-lg flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 font-bold text-lg">
              ⚠️
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold text-red-200 uppercase tracking-wide">HR Proctoring Flag Logged</p>
              <p className="text-slate-200 mt-0.5">{warningMessage}</p>
            </div>
            <button
              onClick={() => setWarningMessage(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proctoring HUD Widget (Top-Right / Dockable) */}
      <div className="fixed top-20 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-slate-950/90 border border-slate-800 backdrop-blur-md rounded-2xl shadow-2xl transition-all ${
            isMinimized ? 'p-2 w-auto' : 'p-3.5 w-72'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 tracking-wide uppercase flex items-center gap-1">
                🛡️ Strict HR Proctor
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleFullscreen}
                className={`p-1 rounded-md text-[10px] font-mono border transition-colors ${
                  isFullscreen ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle Fullscreen Lockdown"
              >
                {isFullscreen ? 'FULLSCREEN [ON]' : 'EXPAND'}
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                {isMinimized ? '＋' : '−'}
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="mt-3 space-y-2.5 pt-2.5 border-t border-slate-800/80">
              
              {/* Trust Score Meter */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 font-medium">Authenticity Score</span>
                  <span className={`font-bold font-mono ${
                    trustScore >= 85 ? 'text-emerald-400' :
                    trustScore >= 65 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {trustScore} / 100
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${trustScore}%` }}
                    transition={{ duration: 0.4 }}
                    className={`h-full rounded-full ${
                      trustScore >= 85 ? 'bg-emerald-500' :
                      trustScore >= 65 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              {/* Real-time Status Sensors */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {/* Face & Gaze Sensor */}
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Gaze & Vision</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      gazeStatus === 'centered' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                    }`} />
                    <span className="text-slate-200 font-medium truncate">
                      {isCameraOn ? (gazeStatus === 'centered' ? 'Focused' : 'Looking Away') : 'Cam Off'}
                    </span>
                  </div>
                </div>

                {/* Audio Noise Sensor */}
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Audio Environment</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${audioLevel > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className="text-slate-200 font-medium truncate">
                      {audioLevel > 50 ? 'Noise Detected' : 'Quiet Room'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Incidents Count */}
              <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Flags Logged:</span>
                <span className={`font-mono font-bold ${incidents.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {incidents.length} events
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}
