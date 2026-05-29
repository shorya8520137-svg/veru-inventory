'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'

function BrainNodes() {
  const groupRef = useRef()
  const nodesRef = useRef([])
  const pulseRef = useRef(0)

  const { positions, connections } = useMemo(() => {
    const pts = []
    const conns = []
    const count = 80

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2.5 + Math.random() * 1.5
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.cos(phi) * 0.7
      const z = r * Math.sin(phi) * Math.sin(theta) * 0.8
      pts.push(new THREE.Vector3(x, y, z))
    }

    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dist = pts[i].distanceTo(pts[j])
        if (dist < 2) {
          conns.push({ start: pts[i], end: pts[j], dist })
        }
      }
    }

    return { positions: pts, connections: conns }
  }, [])

  useFrame((state) => {
    pulseRef.current = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
    }
    nodesRef.current.forEach((mesh, i) => {
      if (mesh) {
        const scale = 1 + 0.3 * Math.sin(state.clock.elapsedTime * 1.5 + i * 0.5)
        mesh.scale.setScalar(scale)
      }
    })
  })

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => { nodesRef.current[i] = el }}
          position={pos}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#34d399"
            emissiveIntensity={0.4 + Math.random() * 0.3}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
      {connections.map((conn, i) => (
        <Line
          key={i}
          points={[conn.start, conn.end]}
          color="#34d399"
          transparent
          opacity={0.12 + (1 - conn.dist / 2) * 0.15}
          lineWidth={0.5}
        />
      ))}
    </group>
  )
}

function GlowParticles() {
  const count = 200
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 10
    }
    return pos
  }, [])

  const pointsRef = useRef()
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#34d399" transparent opacity={0.3} sizeAttenuation />
    </points>
  )
}

export default function BrainNetwork() {
  return (
    <div className="relative w-full h-full min-h-[500px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#10b981" />
        <pointLight position={[-5, -5, -5]} intensity={0.4} color="#34d399" />
        <BrainNodes />
        <GlowParticles />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}
