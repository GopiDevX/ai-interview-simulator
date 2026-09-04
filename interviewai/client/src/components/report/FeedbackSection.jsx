import { motion } from 'framer-motion'
import Badge from '../ui/Badge.jsx'

export default function FeedbackSection({ strengths = [], improvements = [], detailedFeedback = {} }) {
  return (
    <div className="space-y-6">
      {/* Strengths */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <span className="text-green-400 text-sm">✓</span>
          </div>
          <h3 className="font-semibold text-white">Strengths</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {strengths.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <Badge variant="green">✓ {s}</Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Improvements */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 text-sm">↑</span>
          </div>
          <h3 className="font-semibold text-white">Areas to Improve</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {improvements.map((imp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <Badge variant="amber">→ {imp}</Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Detailed feedback */}
      {detailedFeedback && Object.keys(detailedFeedback).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 space-y-5"
        >
          <h3 className="font-semibold text-white">Detailed Analysis</h3>
          {Object.entries(detailedFeedback).map(([key, value], i) => (
            <div key={key} className="space-y-2">
              <h4 className="text-sm font-medium text-blue-400 capitalize">{key}</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{value}</p>
              {i < Object.keys(detailedFeedback).length - 1 && (
                <div className="border-t border-white/5 pt-1" />
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
