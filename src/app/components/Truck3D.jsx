'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import * as THREE from 'three'

function TruckModel() {
  const groupRef = useRef()
  const wheelRefs = useRef([])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15
      groupRef.current.position.y = 0.05 * Math.sin(state.clock.elapsedTime * 0.8)
    }
    wheelRefs.current.forEach((wheel) => {
      if (wheel) {
        wheel.rotation.x = state.clock.elapsedTime * 2
      }
    })
  })

  return (
    <group ref={groupRef}>
      {/* Cargo box */}
      <mesh position={[-0.8, 0.6, 0]}>
        <boxGeometry args={[1.8, 1, 1.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Cab */}
      <mesh position={[1.2, 0.5, 0]}>
        <boxGeometry args={[0.7, 0.7, 1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Windshield */}
      <mesh position={[1.55, 0.6, 0]}>
        <boxGeometry args={[0.05, 0.35, 0.7]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.15} roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Chassis */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[2.6, 0.1, 1.1]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Wheels */}
      {[[-0.6, -0.15, -0.65], [0.6, -0.15, -0.65], [-0.6, -0.15, 0.65], [0.6, -0.15, 0.65]].map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => { wheelRefs.current[i] = el }}
          position={pos}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      ))}

      {/* Cargo glow strip */}
      <mesh position={[-0.8, 1.1, 0]}>
        <boxGeometry args={[1.7, 0.03, 0.01]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

export default function Truck3D() {
  return (
    <div className="relative w-full h-full min-h-[300px]">
      <Canvas camera={{ position: [0, 0.5, 3.5], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-3, 2, -3]} intensity={0.3} color="#34d399" />
        <TruckModel />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  )
}
