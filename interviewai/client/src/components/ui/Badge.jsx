const variants = {
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  green: 'bg-green-500/20 text-green-400 border border-green-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  slate: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

export default function Badge({ children, variant = 'blue', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
