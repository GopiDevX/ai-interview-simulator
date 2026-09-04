import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socketInstance = null

export const useSocket = () => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      })
    }
    socketRef.current = socketInstance

    return () => {
      // Don't disconnect on component unmount — reuse connection
    }
  }, [])

  const joinSession = useCallback((sessionId) => {
    socketRef.current?.emit('join-session', { sessionId })
  }, [])

  const leaveSession = useCallback((sessionId) => {
    socketRef.current?.emit('leave-session', { sessionId })
  }, [])

  const sendMessage = useCallback((sessionId, content, stage, questionIndex) => {
    socketRef.current?.emit('send-message', { sessionId, content, stage, questionIndex })
  }, [])

  const onTyping = useCallback((callback) => {
    socketRef.current?.on('ai-typing', callback)
    return () => socketRef.current?.off('ai-typing', callback)
  }, [])

  const onChunk = useCallback((callback) => {
    socketRef.current?.on('ai-message-chunk', callback)
    return () => socketRef.current?.off('ai-message-chunk', callback)
  }, [])

  const onDone = useCallback((callback) => {
    socketRef.current?.on('ai-message-done', callback)
    return () => socketRef.current?.off('ai-message-done', callback)
  }, [])

  const onStageChange = useCallback((callback) => {
    socketRef.current?.on('session-stage-change', callback)
    return () => socketRef.current?.off('session-stage-change', callback)
  }, [])

  return { joinSession, leaveSession, sendMessage, onTyping, onChunk, onDone, onStageChange, socket: socketRef }
}
