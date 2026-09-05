import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

// We use a public sample ReadyPlayerMe avatar URL for demonstration purposes.
// This is a standard GLB format model with morph targets for facial expressions.
const AVATAR_URL = 'https://models.readyplayer.me/64b5952d431c3b6f125a29f8.glb'

function Model({ isSpeaking }) {
  const group = useRef()
  const { scene, nodes } = useGLTF(AVATAR_URL)
  
  // Find the head/teeth meshes that contain the morph targets for lip syncing
  const headMesh = nodes.Wolf3D_Head || nodes.Wolf3D_Avatar || Object.values(nodes).find(n => n.morphTargetDictionary)
  const teethMesh = nodes.Wolf3D_Teeth

  useFrame((state) => {
    // 1. Idle Breathing Animation (Gentle Y-axis bobbing)
    const t = state.clock.getElapsedTime()
    group.current.position.y = -1.5 + Math.sin(t * 1.5) * 0.02
    
    // Slight head sway
    group.current.rotation.y = Math.sin(t * 0.5) * 0.1
    group.current.rotation.x = Math.sin(t * 0.3) * 0.05

    // 2. Lip Syncing (Viseme Animation)
    // If the AI is actively streaming text, we randomly animate the jaw/mouth open morph targets.
    // We use a combination of sine waves and random noise to make it look like syllables.
    if (headMesh && headMesh.morphTargetDictionary) {
      const mouthOpenIdx = headMesh.morphTargetDictionary['mouthOpen']
      const visemeOIdx = headMesh.morphTargetDictionary['viseme_O']
      
      if (isSpeaking) {
        // High frequency sine wave with some noise for speech simulation
        const speechIntensity = Math.abs(Math.sin(t * 15)) * 0.8 + (Math.random() * 0.2)
        
        if (mouthOpenIdx !== undefined) headMesh.morphTargetInfluences[mouthOpenIdx] = speechIntensity
        if (visemeOIdx !== undefined) headMesh.morphTargetInfluences[visemeOIdx] = speechIntensity * 0.5
        
        if (teethMesh && teethMesh.morphTargetDictionary && teethMesh.morphTargetDictionary['mouthOpen'] !== undefined) {
          teethMesh.morphTargetInfluences[teethMesh.morphTargetDictionary['mouthOpen']] = speechIntensity
        }
      } else {
        // Close mouth completely when not speaking
        if (mouthOpenIdx !== undefined) headMesh.morphTargetInfluences[mouthOpenIdx] = 0
        if (visemeOIdx !== undefined) headMesh.morphTargetInfluences[visemeOIdx] = 0
        
        if (teethMesh && teethMesh.morphTargetDictionary && teethMesh.morphTargetDictionary['mouthOpen'] !== undefined) {
          teethMesh.morphTargetInfluences[teethMesh.morphTargetDictionary['mouthOpen']] = 0
        }
      }
    }
  })

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

export default function Avatar({ isSpeaking }) {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0.5, 3], fov: 30 }}>
        <color attach="background" args={['#0f172a']} />
        
        {/* Lighting setup for a professional studio look */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[-5, 5, 5]} intensity={1} color="#e0f2fe" />
        <directionalLight position={[5, 5, -5]} intensity={0.5} color="#bae6fd" />
        
        <Environment preset="city" />

        <Model isSpeaking={isSpeaking} />

        <ContactShadows opacity={0.4} scale={10} blur={2} far={4} color="#000000" />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 2 - 0.1}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minAzimuthAngle={-0.2}
          maxAzimuthAngle={0.2}
        />
      </Canvas>
    </div>
  )
}

// Preload the model to avoid a loading pop-in
useGLTF.preload(AVATAR_URL)
