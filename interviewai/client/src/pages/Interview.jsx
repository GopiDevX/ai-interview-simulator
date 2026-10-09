import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { interviewApi } from '../api/interview.js'
import { useSocket } from '../hooks/useSocket.js'
import ChatBubble, { TypingIndicator } from '../components/interview/ChatBubble.jsx'
import Timer from '../components/interview/Timer.jsx'
import Button from '../components/ui/Button.jsx'
import HRAvatar, { HR_PERSONAS } from '../components/interview/HRAvatar.jsx'
import ProctoringHUD from '../components/interview/ProctoringHUD.jsx'
import HumanProctorOfficer from '../components/interview/HumanProctorOfficer.jsx'
import { stages, stageLabels, getStageProgress } from '../utils/helpers.js'

const STAGE_QUESTIONS_COUNT = { intro: 1, background: 2, technical: 3, behavioral: 2, coding: 1 }

export default function Interview() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { joinSession, sendMessage: socketSend, onTyping, onChunk, onDone, onStageChange } = useSocket()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [stage, setStage] = useState('intro')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sessionData, setSessionData] = useState(null)
  const [startTime] = useState(new Date())
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)

  // HR & Proctoring State
  const [selectedPersona, setSelectedPersona] = useState(location.state?.persona || 'sarah')
  const [isStrictMode, setIsStrictMode] = useState(location.state?.isStrictMode !== false)
  const [trustScore, setTrustScore] = useState(100)
  const [proctoringIncidents, setProctoringIncidents] = useState([])

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const streamBufferRef = useRef('')
  const recognitionRef = useRef(null)
  const isVoiceEnabledRef = useRef(isVoiceEnabled)
  const selectedPersonaRef = useRef(selectedPersona)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    isVoiceEnabledRef.current = isVoiceEnabled
  }, [isVoiceEnabled])

  useEffect(() => {
    selectedPersonaRef.current = selectedPersona
  }, [selectedPersona])

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + (prev ? ' ' : '') + finalTranscript)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        console.error("Speech recognition error:", e)
      }
    }
  }

  // Camera Management
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCameraOn(true)
    } catch (err) {
      console.warn("Camera auto-start not permitted:", err)
      setIsCameraOn(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOn(false)
  }

  const toggleCamera = async () => {
    if (isCameraOn) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, streamingText])

  // Load session and join socket room
  useEffect(() => {
    joinSession(sessionId)

    interviewApi.getSession(sessionId)
      .then(({ data }) => {
        setSessionData(data)
        if (data.transcript?.length > 0) {
          setMessages(data.transcript.map((m, i) => ({ ...m, id: i })))
          setStage(data.stage || 'intro')
        }
        setSessionLoaded(true)
      })
      .catch(() => {
        const qp = location.state?.questionPlan
        if (qp) setSessionData({ questionPlan: qp })
        setSessionLoaded(true)
      })
  }, [sessionId])

  // Initial AI greeting
  useEffect(() => {
    if (!sessionLoaded || messages.length > 0) return
    setTimeout(() => {
      triggerAIMessage('intro', 0)
    }, 800)
  }, [sessionLoaded])

  // Realistic Human Voice Speech Synthesis Helper
  const speakText = (text) => {
    if (!isVoiceEnabledRef.current || !window.speechSynthesis) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Choose realistic voice matching the persona
    const voices = window.speechSynthesis.getVoices()
    const persona = HR_PERSONAS.find(p => p.id === selectedPersonaRef.current) || HR_PERSONAS[0]

    let matchedVoice = null
    if (persona.voiceName === 'female') {
      matchedVoice = voices.find(v => (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Natural')) && v.lang.startsWith('en'))
        || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
    } else {
      matchedVoice = voices.find(v => (v.name.includes('David') || v.name.includes('Guy') || v.name.includes('Natural')) && v.lang.startsWith('en'))
        || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'))
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice
    }

    utterance.rate = 1.02
    utterance.pitch = persona.voiceName === 'female' ? 1.05 : 0.95
    window.speechSynthesis.speak(utterance)
  }

  // Socket event listeners
  useEffect(() => {
    const cleanTyping = onTyping(({ isTyping: t }) => setIsTyping(t))
    const cleanChunk = onChunk(({ text }) => {
      streamBufferRef.current += text
      setStreamingText(prev => prev + text)
      setIsStreaming(true)
    })
    const cleanDone = onDone(({ fullText, shouldMoveToCoding }) => {
      setIsTyping(false)
      setIsStreaming(false)
      setStreamingText('')
      streamBufferRef.current = ''

      const aiMsg = { role: 'interviewer', content: fullText, timestamp: new Date(), id: Date.now() }
      setMessages(prev => [...prev, aiMsg])
      setCurrentQuestion(fullText)
      setIsSending(false)

      speakText(fullText)

      if (shouldMoveToCoding) {
        setTimeout(() => {
          navigate(`/coding/${sessionId}`, { 
            state: { 
              sessionData, 
              questionPlan: location.state?.questionPlan,
              persona: selectedPersona,
              trustScore,
              proctoringIncidents
            } 
          })
        }, 2000)
      }
    })
    const cleanStage = onStageChange(({ stage: newStage }) => {
      setStage(newStage)
    })

    return () => { cleanTyping?.(); cleanChunk?.(); cleanDone?.(); cleanStage?.() }
  }, [sessionData, navigate, sessionId, selectedPersona, trustScore, proctoringIncidents])

  const triggerAIMessage = (currentStage, qIndex) => {
    setIsTyping(true)
    socketSend(sessionId, '', currentStage, qIndex)
  }

  const handleSend = async () => {
    if (!input.trim() || isSending || isTyping) return

    const userMsg = { role: 'candidate', content: input, timestamp: new Date(), id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    const sentContent = input
    setInput('')
    setIsSending(true)

    if (currentQuestion) {
      interviewApi.evaluateAnswer({
        sessionId,
        question: currentQuestion,
        answer: sentContent
      }).then(({ data }) => {
        setMessages(prev => prev.map(m =>
          m.id === userMsg.id ? { ...m, score: data.score, feedback: data.feedback } : m
        ))
      }).catch(() => {})
    }

    const stageOrder = ['intro', 'background', 'technical', 'behavioral', 'coding']
    const currentIdx = stageOrder.indexOf(stage)
    const maxQ = STAGE_QUESTIONS_COUNT[stage] || 2
    let nextStage = stage
    let nextQIndex = questionIndex + 1

    if (nextQIndex >= maxQ) {
      nextQIndex = 0
      nextStage = stageOrder[currentIdx + 1] || 'done'
    }

    setStage(nextStage)
    setQuestionIndex(nextQIndex)

    if (nextStage !== stage) {
      interviewApi.updateStage(sessionId, nextStage).catch(() => {})
    }

    socketSend(sessionId, sentContent, nextStage, nextQIndex)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEndInterview = async () => {
    if (!window.confirm('Conclude the HR interview and view your evaluation report?')) return
    window.speechSynthesis?.cancel()
    stopCamera()
    try {
      await interviewApi.endInterview(sessionId)
      navigate(`/report/${sessionId}`, {
        state: {
          trustScore,
          proctoringIncidents,
          persona: selectedPersona
        }
      })
    } catch {
      toast.error('Failed to conclude interview session')
    }
  }

  const progress = getStageProgress(stage)
  const activePersonaObj = HR_PERSONAS.find(p => p.id === selectedPersona) || HR_PERSONAS[0]

  return (
    <div className="h-screen flex flex-col bg-[#0F172A] pt-16">
      
      {/* Strict Proctoring HUD */}
      <ProctoringHUD
        isStrict={isStrictMode}
        isCameraOn={isCameraOn}
        videoRef={videoRef}
        onTrustScoreChange={(score, incidents) => {
          setTrustScore(score)
          setProctoringIncidents(incidents)
        }}
      />

      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#0F172A]/90 backdrop-blur px-4 py-3">
        <div className="h-1 bg-white/5 rounded-full mb-3 overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full progress-glow"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stages.filter(s => s !== 'done').map((s) => (
              <div
                key={s}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  s === stage ? 'bg-blue-600 text-white shadow-md' :
                  stages.indexOf(s) < stages.indexOf(stage) ? 'bg-emerald-500/20 text-emerald-400' :
                  'text-slate-500'
                }`}
              >
                {stageLabels[s]}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`p-2 rounded-xl transition-colors border ${isCameraOn ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : 'text-slate-400 bg-white/5 border-white/10 hover:text-white'}`}
              title={isCameraOn ? "Webcam Active" : "Enable Webcam"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Voice Toggle */}
            <button
              onClick={() => {
                setIsVoiceEnabled(!isVoiceEnabled)
                if (isVoiceEnabled) window.speechSynthesis?.cancel()
              }}
              className={`p-2 rounded-xl transition-colors border ${isVoiceEnabled ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : 'text-slate-400 bg-white/5 border-white/10 hover:text-white'}`}
              title={isVoiceEnabled ? "HR Voice Enabled" : "HR Voice Muted"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            <Timer startTime={startTime} />

            <Button variant="danger" size="sm" onClick={handleEndInterview}>
              Conclude
            </Button>
          </div>
        </div>
      </div>

      {/* Photorealistic HR & Human Proctor Video Conference Area */}
      <div className="flex-shrink-0 h-[44vh] sm:h-[50vh] border-b border-white/10 relative overflow-hidden bg-[#080D1A] shadow-2xl">
        <HRAvatar
          isSpeaking={isStreaming}
          stage={stage}
          company={sessionData?.company}
          selectedPersona={selectedPersona}
          onSelectPersona={setSelectedPersona}
        />

        {/* Live Human Invigilator Stream (Docked Top-Left or In-Session) */}
        {isStrictMode && (
          <div className="hidden md:block absolute bottom-4 left-6 z-20 w-44 shadow-2xl">
            <HumanProctorOfficer
              isStrict={isStrictMode}
              trustScore={trustScore}
              incidentsCount={proctoringIncidents.length}
            />
          </div>
        )}
      </div>

      {/* Chat Transcript Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Real-time Streaming HR Response */}
        {isStreaming && streamingText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <img
              src={activePersonaObj.image}
              alt={activePersonaObj.name}
              className="flex-shrink-0 w-8 h-8 rounded-full object-cover border border-blue-400/50 shadow-md mt-1"
            />
            <div className="max-w-[80%] bg-slate-900/90 border border-blue-500/20 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-100 leading-relaxed shadow-lg">
              <span className="text-[10px] font-bold text-blue-400 block mb-1 uppercase tracking-wider">
                {activePersonaObj.name} (HR Lead)
              </span>
              {streamingText}
              <span className="inline-block w-0.5 h-4 bg-cyan-400 animate-pulse ml-1 align-middle" />
            </div>
          </motion.div>
        )}

        {isTyping && !isStreaming && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input / Response Bar */}
      <div className="flex-shrink-0 border-t border-white/5 bg-[#0F172A]/90 backdrop-blur p-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTyping ? `${activePersonaObj.name} is evaluating...` : 'Structure your response using the STAR method (Situation, Task, Action, Result)...'}
              disabled={isTyping || isSending || isListening}
              rows={2}
              className={`w-full bg-slate-900/80 border text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-all disabled:opacity-50 ${isListening ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'}`}
            />
          </div>
          <button
            onClick={toggleListening}
            disabled={isTyping || isSending || !recognitionRef.current}
            className={`flex-shrink-0 h-[58px] w-[58px] rounded-xl flex items-center justify-center transition-all disabled:opacity-50 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50' : 'bg-slate-900/80 text-slate-400 hover:bg-white/10 border border-white/10'}`}
            title="Speak Answer via Microphone"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || isSending}
            loading={isSending}
            size="md"
            className="h-[58px] px-6 flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
        <p className="text-center text-slate-500 text-xs mt-2">
          Evaluating Candidate for <strong>{sessionData?.role || 'Software Engineering'}</strong> at <strong>{sessionData?.company || 'Enterprise'}</strong>
        </p>
      </div>

      {/* Floating Candidate Webcam with Real-time AI Vision HUD */}
      <AnimatePresence>
        {isCameraOn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 w-52 h-40 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/50 z-50 pointer-events-none group"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />

            {/* AI Face Detection Bounding Reticle */}
            <div className="absolute inset-4 border-2 border-emerald-400/60 rounded-xl pointer-events-none flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
              
              {/* Centroid Focus Reticle */}
              <div className="w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>

            {/* Top Bar: Verification Badge */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[9px] text-emerald-400 font-semibold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI Face Track Active
              </div>
              <div className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[8px] font-mono text-cyan-300">
                99.4%
              </div>
            </div>

            {/* Bottom Bar: Live Environment Sensor */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 rounded-lg bg-black/75 backdrop-blur-sm border border-white/10 text-[9px] text-slate-300 pointer-events-none font-mono">
              <span className="text-emerald-400">Gaze: Centered</span>
              <span className="text-cyan-300">Mic: Calibrated</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
