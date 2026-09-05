import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { interviewApi } from '../api/interview.js'
import { useSocket } from '../hooks/useSocket.js'
import ChatBubble, { TypingIndicator } from '../components/interview/ChatBubble.jsx'
import Timer from '../components/interview/Timer.jsx'
import Button from '../components/ui/Button.jsx'
import Avatar from '../components/interview/Avatar.jsx'
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
  const [isCameraOn, setIsCameraOn] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const streamBufferRef = useRef('')
  const recognitionRef = useRef(null)
  const isVoiceEnabledRef = useRef(isVoiceEnabled)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    isVoiceEnabledRef.current = isVoiceEnabled
  }, [isVoiceEnabled])

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
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setIsCameraOn(true)
      } catch (err) {
        console.error("Camera access denied or error:", err)
        toast.error("Could not access camera.")
      }
    }
  }

  useEffect(() => {
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

    // Load session data
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
        // Session might be new — use question plan from location state
        const qp = location.state?.questionPlan
        if (qp) setSessionData({ questionPlan: qp })
        setSessionLoaded(true)
      })
  }, [sessionId])

  // Initial AI greeting
  useEffect(() => {
    if (!sessionLoaded || messages.length > 0) return
    // Trigger first AI message
    setTimeout(() => {
      triggerAIMessage('intro', 0)
    }, 800)
  }, [sessionLoaded])

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

      if (isVoiceEnabledRef.current && window.speechSynthesis) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(fullText)
        utterance.rate = 1.05
        window.speechSynthesis.speak(utterance)
      }

      if (shouldMoveToCoding) {
        setTimeout(() => {
          navigate(`/coding/${sessionId}`, { state: { sessionData, questionPlan: location.state?.questionPlan } })
        }, 2000)
      }
    })
    const cleanStage = onStageChange(({ stage: newStage }) => {
      setStage(newStage)
    })

    return () => { cleanTyping?.(); cleanChunk?.(); cleanDone?.(); cleanStage?.() }
  }, [sessionData, navigate, sessionId])

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

    // Evaluate answer in background
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

    // Determine next stage/question
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

    // Update stage on backend
    if (nextStage !== stage) {
      interviewApi.updateStage(sessionId, nextStage).catch(() => {})
    }

    // Send via socket to get AI response
    socketSend(sessionId, sentContent, nextStage, nextQIndex)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEndInterview = async () => {
    if (!window.confirm('End the interview and go to report?')) return
    window.speechSynthesis?.cancel() // Stop AI voice if ending
    stopCamera() // Stop camera if ending
    try {
      await interviewApi.endInterview(sessionId)
      navigate(`/report/${sessionId}`)
    } catch {
      toast.error('Failed to end interview')
    }
  }

  const progress = getStageProgress(stage)

  return (
    <div className="h-screen flex flex-col bg-[#0F172A] pt-16">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#0F172A]/90 backdrop-blur px-4 py-3">
        {/* Progress bar */}
        <div className="h-1 bg-white/5 rounded-full mb-3 overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full progress-glow"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stages.filter(s => s !== 'done').map((s) => (
              <div
                key={s}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  s === stage ? 'bg-blue-500 text-white' :
                  stages.indexOf(s) < stages.indexOf(stage) ? 'bg-green-500/20 text-green-400' :
                  'text-slate-600'
                }`}
              >
                {stageLabels[s]}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleCamera}
              className={`p-1.5 rounded-full transition-colors ${isCameraOn ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'}`}
              title={isCameraOn ? "Disable Camera" : "Enable Camera"}
            >
              {isCameraOn ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                setIsVoiceEnabled(!isVoiceEnabled)
                if (isVoiceEnabled) window.speechSynthesis?.cancel()
              }}
              className={`p-1.5 rounded-full transition-colors ${isVoiceEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'}`}
              title={isVoiceEnabled ? "Disable AI Voice" : "Enable AI Voice"}
            >
              {isVoiceEnabled ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <line x1="17" y1="7" x2="21" y2="17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              )}
            </button>
            <Timer startTime={startTime} />
            <Button variant="danger" size="sm" onClick={handleEndInterview}>
              End Interview
            </Button>
          </div>
        </div>
      </div>

      {/* 3D Avatar Area */}
      <div className="flex-shrink-0 h-[30vh] sm:h-[40vh] border-b border-white/5 relative overflow-hidden bg-gradient-to-b from-navy-dark to-slate-900 shadow-[inset_0_-30px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay z-10 pointer-events-none" />
        <Avatar isSpeaking={isStreaming} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Streaming AI response */}
        {isStreaming && streamingText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold mt-1 glow-blue-sm">
              AI
            </div>
            <div className="max-w-[75%] bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-200 leading-relaxed">
              {streamingText}
              <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
            </div>
          </motion.div>
        )}

        {isTyping && !isStreaming && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-white/5 bg-[#0F172A]/90 backdrop-blur p-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTyping ? 'Alex is typing...' : 'Type your answer or use the microphone...'}
              disabled={isTyping || isSending || isListening}
              rows={2}
              className={`w-full bg-white/5 border text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-all disabled:opacity-50 ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'}`}
            />
          </div>
          <button
            onClick={toggleListening}
            disabled={isTyping || isSending || !recognitionRef.current}
            className={`flex-shrink-0 h-[58px] w-[58px] rounded-xl flex items-center justify-center transition-all disabled:opacity-50 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'}`}
            title="Toggle Microphone"
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
            className="h-[58px] px-5 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
        <p className="text-center text-slate-600 text-xs mt-2">
          {sessionData?.role} · {sessionData?.company} Interview
        </p>
      </div>

      {/* Floating Webcam Feed */}
      <AnimatePresence>
        {isCameraOn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 w-48 h-36 bg-[#0F172A] rounded-xl overflow-hidden shadow-2xl border border-white/10 z-50 pointer-events-none"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
