export const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-blue-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

export const getScoreBg = (score) => {
  if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (score >= 60) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  if (score >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

export const getHireColor = (suggestion) => {
  const map = {
    'Strong Hire': 'hire-strong',
    'Hire': 'hire-regular',
    'Borderline': 'hire-borderline',
    'No Hire': 'hire-no',
  }
  return map[suggestion] || 'hire-borderline'
}

export const stages = ['intro', 'background', 'technical', 'behavioral', 'coding', 'done']

export const stageLabels = {
  intro: 'Introduction',
  background: 'Background',
  technical: 'Technical',
  behavioral: 'Behavioral',
  coding: 'Coding',
  done: 'Complete'
}

export const getStageProgress = (stage) => {
  const idx = stages.indexOf(stage)
  return idx >= 0 ? Math.round((idx / (stages.length - 1)) * 100) : 0
}

export const truncate = (text, maxLen = 100) =>
  text?.length > maxLen ? text.slice(0, maxLen) + '...' : text

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
