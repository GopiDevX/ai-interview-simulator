import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext.jsx'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
        isDark
          ? 'bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-sm'
      } ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-5 h-5 flex items-center justify-center text-lg"
      >
        {isDark ? '☀️' : '🌙'}
      </motion.div>
    </button>
  )
}
