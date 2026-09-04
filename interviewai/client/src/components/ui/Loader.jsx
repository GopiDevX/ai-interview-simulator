export default function Loader({ size = 'md', text = '' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
      </div>
      {text && <p className="text-slate-400 text-sm animate-pulse">{text}</p>}
    </div>
  )
}

export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return <div className={`${width} ${height} bg-white/5 rounded-lg animate-pulse`} />
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-3">
      <SkeletonLine width="w-1/3" height="h-5" />
      <SkeletonLine />
      <SkeletonLine width="w-3/4" />
      <SkeletonLine width="w-1/2" />
    </div>
  )
}
