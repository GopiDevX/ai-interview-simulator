import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'

const STARTERS = {
  javascript: 'function solve(input) {\n  // your code here\n}',
  python: 'def solve(input):\n  # your code here\n  pass',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  // your code here\n  return 0;\n}'
}

export default function PeerInterview() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  
  const [socket, setSocket] = useState(null)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(STARTERS.javascript)
  
  // WebRTC Refs
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)

  // WebRTC Configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000')
    setSocket(newSocket)

    const initWebRTC = async () => {
      try {
        // 1. Get local media (Video/Audio)
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // 2. Setup RTCPeerConnection
        const pc = new RTCPeerConnection(rtcConfig)
        peerConnectionRef.current = pc

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => pc.addTrack(track, stream))

        // Handle incoming remote track
        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0]
          }
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            newSocket.emit('webrtc-ice-candidate', { candidate: event.candidate, roomId })
          }
        }

        // 3. Socket Event Listeners for WebRTC Signaling
        newSocket.on('initiate-offer', async () => {
          // The socket server tells the first person in the room to create the offer
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          newSocket.emit('webrtc-offer', { offer, roomId })
        })

        newSocket.on('webrtc-offer', async ({ offer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(offer))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          newSocket.emit('webrtc-answer', { answer, roomId })
        })

        newSocket.on('webrtc-answer', async ({ answer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
        })

        newSocket.on('webrtc-ice-candidate', async ({ candidate }) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (e) {
            console.error('Error adding received ice candidate', e)
          }
        })

        // 4. Socket Listeners for Code Sync
        newSocket.on('code-update', ({ code }) => {
          setCode(code) // Update local code when partner types
        })

        // Join the socket room specifically for signaling
        newSocket.emit('join-session', { sessionId: roomId })

      } catch (err) {
        console.error('Error accessing media devices:', err)
        toast.error('Could not access camera/microphone. Are you on HTTPS or localhost?')
      }
    }

    initWebRTC()

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      newSocket.disconnect()
    }
  }, [roomId])

  const handleEditorChange = (value) => {
    setCode(value)
    if (socket) {
      socket.emit('code-update', { code: value, roomId })
    }
  }

  const handleLeave = () => {
    navigate('/dashboard')
  }

  return (
    <div className="h-screen flex flex-col bg-navy-dark pt-16">
      {/* Header bar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-navy">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Peer Session
          </h1>
          <span className="text-slate-500 text-sm">Room: {roomId.split('_')[1]}</span>
        </div>
        <button 
          onClick={handleLeave}
          className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
        >
          Leave Room
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Video Streams */}
        <div className="w-80 border-r border-white/10 bg-navy flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Remote Video */}
          <div className="flex-1 min-h-[200px] bg-black rounded-xl overflow-hidden relative border border-white/5 shadow-lg">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded">
              Partner
            </div>
            {/* If no video is playing yet, show a waiting state */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 bg-slate-900">
              <span className="text-slate-600 text-sm animate-pulse">Waiting for partner...</span>
            </div>
          </div>

          {/* Local Video */}
          <div className="flex-1 min-h-[200px] bg-black rounded-xl overflow-hidden relative border border-white/5 shadow-lg">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" // mirror local video
            />
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded">
              You
            </div>
          </div>
          
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mt-auto">
            <p className="text-blue-400 text-xs text-center">
              WebRTC connection established via signaling server. Audio & Video are peer-to-peer.
            </p>
          </div>
        </div>

        {/* Right Side: Collaborative Editor */}
        <div className="flex-1 flex flex-col bg-navy-dark">
          <div className="h-12 border-b border-white/10 flex items-center px-4 bg-navy gap-4">
            <span className="text-slate-400 text-sm font-medium">Shared Editor</span>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value)
                setCode(STARTERS[e.target.value])
                socket?.emit('code-update', { code: STARTERS[e.target.value], roomId })
              }}
              className="bg-navy-dark border border-white/10 text-white text-sm rounded-lg focus:ring-electric-blue focus:border-electric-blue block p-1.5"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div className="flex-1 p-4">
            <div className="h-full rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  padding: { top: 20 },
                  fontFamily: 'JetBrains Mono, monospace',
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
