import React, { useRef, useState, useEffect } from 'react'

export default function Whiteboard() {
  const canvasRef = useRef(null)
  const [tool, setTool] = useState('pen') // 'pen', 'rect', 'circle', 'line', 'eraser'
  const [color, setColor] = useState('#3b82f6')
  const [lineWidth, setLineWidth] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState([])
  const [snapshot, setSnapshot] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight

    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Initial background
    ctx.fillStyle = '#0b1120'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    drawGrid(ctx, canvas.width, canvas.height)
    saveState()

    const handleResize = () => {
      const prev = ctx.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      ctx.putImageData(prev, 0, 0)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const drawGrid = (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.lineWidth = 1
    const step = 30
    for (let x = 0; x < w; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    setHistory(prev => [...prev.slice(-15), ctx.getImageData(0, 0, canvas.width, canvas.height)])
  }

  const undo = () => {
    if (history.length <= 1) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const newHistory = [...history]
    newHistory.pop()
    const previous = newHistory[newHistory.length - 1]
    ctx.putImageData(previous, 0, 0)
    setHistory(newHistory)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0b1120'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    drawGrid(ctx, canvas.width, canvas.height)
    saveState()
  }

  const startDraw = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    setIsDrawing(true)
    setStartPos({ x, y })
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height))

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineWidth = lineWidth
    ctx.strokeStyle = tool === 'eraser' ? '#0b1120' : color

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (snapshot) {
      ctx.putImageData(snapshot, 0, 0)
      ctx.beginPath()
      if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y)
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    }
  }

  const stopDraw = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveState()
    }
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = 'system-design-architecture.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  const colors = ['#f8fafc', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

  return (
    <div className="w-full h-full relative flex flex-col bg-[#0b1120] select-none">
      {/* Whiteboard Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#1e293b]/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3">
        {/* Tool Selectors */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl">
          {[
            { id: 'pen', icon: '✏️', label: 'Pen' },
            { id: 'rect', icon: '◻️', label: 'Box' },
            { id: 'circle', icon: '⭕', label: 'Circle' },
            { id: 'line', icon: '━', label: 'Arrow/Line' },
            { id: 'eraser', icon: '🧹', label: 'Eraser' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tool === t.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="mr-1">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-[1px] bg-white/10" />

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen') }}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full transition-transform ${
                color === c && tool !== 'eraser' ? 'ring-2 ring-white scale-125' : 'hover:scale-110 opacity-80'
              }`}
            />
          ))}
        </div>

        <div className="h-5 w-[1px] bg-white/10" />

        {/* Line Thickness */}
        <div className="flex items-center gap-1">
          {[2, 4, 8].map(w => (
            <button
              key={w}
              onClick={() => setLineWidth(w)}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs text-slate-300 ${
                lineWidth === w ? 'bg-white/20 font-bold' : 'hover:bg-white/5'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        <div className="h-5 w-[1px] bg-white/10" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            title="Undo"
            className="p-1.5 text-xs text-slate-400 hover:text-white rounded hover:bg-white/5"
          >
            ↩️ Undo
          </button>
          <button
            onClick={clearCanvas}
            title="Clear Canvas"
            className="p-1.5 text-xs text-red-400 hover:text-red-300 rounded hover:bg-red-500/10"
          >
            🗑️ Clear
          </button>
          <button
            onClick={downloadCanvas}
            title="Save Image"
            className="p-1.5 text-xs text-green-400 hover:text-green-300 rounded hover:bg-green-500/10 font-medium"
          >
            💾 Export
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        className="w-full h-full cursor-crosshair"
      />
    </div>
  )
}
