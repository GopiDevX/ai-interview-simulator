import { motion } from 'framer-motion'
import { getScoreColor } from '../../utils/helpers.js'

export default function ScoreCard({ label, score, icon, delay = 0 }) {
  const pct = Math.min(100, Math.max(0, score))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-slate-400 text-sm font-medium">{label}</span>
        </div>
        <span className={`text-2xl font-bold tabular-nums ${getScoreColor(pct)}`}>{pct}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: delay + 0.2, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            pct >= 80 ? 'bg-green-500' :
            pct >= 60 ? 'bg-blue-500' :
            pct >= 40 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
        />
      </div>
    </motion.div>
  )
}

export function CircularScore({ score, size = 160 }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(100, Math.max(0, score))
  const offset = circumference - (pct / 100) * circumference

  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-black text-white tabular-nums"
          style={{ color }}
        >
          {pct}
        </motion.span>
        <span className="text-slate-500 text-xs font-medium">/ 100</span>
      </div>
    </div>
  )
}
