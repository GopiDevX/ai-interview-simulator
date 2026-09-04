import {
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts'

export default function RadarChart({ scores }) {
  const data = [
    { subject: 'Communication', value: scores?.communication || 0, fullMark: 100 },
    { subject: 'Technical', value: scores?.technicalKnowledge || 0, fullMark: 100 },
    { subject: 'Problem Solving', value: scores?.problemSolving || 0, fullMark: 100 },
    { subject: 'Behavioral', value: scores?.behavioralSkills || 0, fullMark: 100 },
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="text-slate-400">{payload[0]?.payload?.subject}</p>
          <p className="text-blue-400 font-bold">{payload[0]?.value}/100</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#475569', fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
