import { motion } from 'framer-motion'

export default function ChatBubble({ message, isLatest = false }) {
  const isAI = message.role === 'interviewer'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      {isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold mt-1 glow-blue-sm">
          AI
        </div>
      )}

      <div className={`max-w-[75%] ${isAI ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isAI
              ? 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'
              : 'bg-blue-500 text-white rounded-tr-sm shadow-lg shadow-blue-500/25'
          }`}
        >
          {message.content}
        </div>

        <div className={`mt-1 flex items-center gap-2 ${isAI ? 'justify-start' : 'justify-end'}`}>
          <span className="text-xs text-slate-500">
            {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isAI && message.score !== null && message.score !== undefined && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              message.score >= 7 ? 'bg-green-500/20 text-green-400' :
              message.score >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {message.score}/10
            </span>
          )}
        </div>
      </div>

      {!isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 border border-white/10 flex items-center justify-center text-white text-xs font-bold mt-1">
          You
        </div>
      )}
    </motion.div>
  )
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-3 justify-start"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold glow-blue-sm">
        AI
      </div>
      <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </motion.div>
  )
}
