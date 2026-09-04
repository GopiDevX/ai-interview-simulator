import { createContext, useContext, useState, useCallback } from 'react'

const InterviewContext = createContext(null)

export const InterviewProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [stage, setStage] = useState('intro')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [report, setReport] = useState(null)

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, { ...message, id: Date.now() + Math.random() }])
  }, [])

  const startSession = useCallback((sessionData) => {
    setSession(sessionData)
    setMessages([])
    setStage('intro')
    setQuestionIndex(0)
    setReport(null)
  }, [])

  const advanceQuestion = useCallback(() => {
    setQuestionIndex(prev => prev + 1)
  }, [])

  const setSessionReport = useCallback((reportData) => {
    setReport(reportData)
  }, [])

  const resetInterview = useCallback(() => {
    setSession(null)
    setMessages([])
    setStage('intro')
    setQuestionIndex(0)
    setReport(null)
  }, [])

  return (
    <InterviewContext.Provider value={{
      session, setSession,
      messages, addMessage,
      stage, setStage,
      questionIndex, advanceQuestion, setQuestionIndex,
      isTyping, setIsTyping,
      report, setSessionReport,
      startSession, resetInterview
    }}>
      {children}
    </InterviewContext.Provider>
  )
}

export const useInterview = () => {
  const ctx = useContext(InterviewContext)
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider')
  return ctx
}
