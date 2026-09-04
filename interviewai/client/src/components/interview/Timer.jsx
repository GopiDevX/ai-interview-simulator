import { useState, useEffect, useRef } from 'react'
import { formatDuration } from '../../utils/helpers.js'

export default function Timer({ startTime, className = '' }) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    const start = startTime ? new Date(startTime).getTime() : Date.now()
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [startTime])

  const isWarning = elapsed > 45 * 60 // 45 minutes
  const isDanger = elapsed > 60 * 60 // 60 minutes

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full animate-pulse ${
        isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'
      }`} />
      <span className={`text-sm font-mono font-medium tabular-nums ${
        isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-400'
      }`}>
        {formatDuration(elapsed)}
      </span>
    </div>
  )
}
