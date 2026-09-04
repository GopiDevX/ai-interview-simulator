import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = false, glow = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        glass-card p-6
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${glow ? 'glow-blue-sm' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>
}
