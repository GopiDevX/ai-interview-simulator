import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function HumanProctorOfficer({
  isStrict = true,
  trustScore = 100,
  incidentsCount = 0,
  gazeStatus = 'verified',
  audioDb = 25
}) {
  const [proctorNote, setProctorNote] = useState('Monitoring candidate feed & room integrity...')

  useEffect(() => {
    if (gazeStatus === 'looking_away') {
      setProctorNote('⚠️ Flagged: Candidate looking away from primary screen.')
    } else if (audioDb > 70) {
      setProctorNote('⚠️ Flagged: Room noise threshold exceeded.')
    } else if (trustScore < 90) {
      setProctorNote('Auditing incident history for security report...')
    } else {
      setProctorNote('Session Verified · Candidate integrity authenticated.')
    }
  }, [gazeStatus, audioDb, trustScore])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl flex flex-col">
      {/* Proctor Video Stream Frame */}
      <div className="relative w-full h-32 sm:h-36 overflow-hidden bg-slate-900">
        <img
          src="/avatars/proctor_vance.jpg"
          alt="Human Proctor Officer Robert Vance"
          className="w-full h-full object-cover object-top filter contrast-[1.05] brightness-95"
        />

        {/* Live Security Room Watermark */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] text-red-400 font-bold border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE INVIGILATOR
        </div>

        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[8px] font-mono text-emerald-400 border border-emerald-500/30">
          ID: #SEC-8821
        </div>

        {/* Proctor Name Tag Overlay */}
        <div className="absolute bottom-1.5 left-2 right-2 px-2 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-white leading-tight">Officer Robert Vance</p>
            <p className="text-[8px] text-slate-400">Lead Security Invigilator</p>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active Audit
          </div>
        </div>
      </div>

      {/* Proctor Live Telemetry & Notes Bar */}
      <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Integrity Trust:</span>
          <span className={`font-mono font-bold ${trustScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {trustScore}% Authenticated
          </span>
        </div>

        <div className="text-[9px] px-2 py-1 rounded bg-black/40 border border-white/5 text-slate-300 italic truncate">
          "{proctorNote}"
        </div>
      </div>
    </div>
  )
}
