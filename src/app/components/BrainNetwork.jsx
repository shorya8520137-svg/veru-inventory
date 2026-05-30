'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const NODE_COUNT = 300
const PACKET_COUNT = 2000
const SPREAD_X = 14
const SPREAD_Y = 9
const SPREAD_Z = 7
const CONNECT_RADIUS = 4.5
const MAX_CONNECT = 30

const COLORS = {
  ops: '#00d4ff',
  commerce: '#10b981',
  logistics: '#4488ff',
  support: '#a855f7',
  supply: '#ff6b9d',
  finance: '#f59e0b',
  intel: '#ffffff',
}

const CATS = ['ops','commerce','logistics','support','supply','finance','intel']

function createNodeTexture(cat, label, idx) {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const ctx = c.getContext('2d')
  const col = COLORS[cat]

  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30)
  g.addColorStop(0, 'rgba(2,11,31,0)')
  g.addColorStop(0.5, 'rgba(2,11,31,0.5)')
  g.addColorStop(1, 'rgba(2,11,31,0.9)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(32, 32, 30, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = col + '60'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(32, 32, 28, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = col + '20'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(32, 32, 26, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = col
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label.charAt(0), 32, 28)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '4px monospace'
  ctx.fillText(label, 32, 48)

  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

function randPos() {
  return new THREE.Vector3(
    (Math.random() - 0.5) * SPREAD_X,
    (Math.random() - 0.5) * SPREAD_Y,
    (Math.random() - 0.5) * SPREAD_Z,
  )
}

function AICore() {
  const ref = useRef()
  useFrame((s) => {
    const t = s.clock.elapsedTime * 2
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.05)
  })
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.12} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} />
      </mesh>
      <pointLight intensity={3} distance={6} color="#00d4ff" />
    </group>
  )
}

function SceneContent() {
  const groupRef = useRef()
  const linesRef = useRef()
  const packetsRef = useRef()

  const labels = useMemo(() => {
    const l = []
    const prefixes = ['WH','STR','PRD','DLV','TRK','CUS','MKT','SUP','SHL','BAR','VEN','PO','INV','RTN','DCT','ANL','AIA','FUL','PAY','SHP','QC','INV','PCK','PKG','DSP','RPL','DFC','VND','CAT','PRC','ORD','RTC','AUD','CMP','STF','NOT','LYL','PRO','SUB','RFID','CDK','SRT','PTW','CAR','TRK','MNF','DUT','TAX','PRC','CNT','SLA','ESC','KNW','CHT','REV','RAT','WSL','ABN','REC','SEG','PRD','ANO','FRD','CYC','ZNE','LOC','PLT','CNT','DCK','YRD','FLT','RTE','LDP','STG','KIT','ASM','LBL','SCN','WGH','DIM','HZM','CLD','EXP','BTH','SRL','LOT','TRA','ORG','CNT','TRF','BRK','INS','CLM','CHB','RMB','ADJ','BDG','FRC','CAP','THR','BNC']
    for (let i = 0; i < NODE_COUNT; i++) {
      l.push(prefixes[i % prefixes.length] + (i + 1))
    }
    return l
  }, [])

  const nodePositions = useMemo(() => Array.from({ length: NODE_COUNT }, randPos), [])
  const textures = useMemo(() => labels.map((l, i) => createNodeTexture(CATS[i % CATS.length], l, i)), [labels])

  const connections = useMemo(() => {
    const conns = []
    for (let i = 0; i < NODE_COUNT; i++) {
      conns.push({ i, j: -1 })
      const pi = nodePositions[i]
      const dists = []
      for (let j = 0; j < NODE_COUNT; j++) {
        if (i === j) continue
        const d = pi.distanceTo(nodePositions[j])
        if (d < CONNECT_RADIUS) dists.push({ j, d })
      }
      dists.sort((a, b) => a.d - b.d)
      const count = Math.min(dists.length, MAX_CONNECT)
      for (let k = 0; k < count; k++) conns.push({ i, j: dists[k].j })
    }
    return conns
  }, [nodePositions])

  const totalConns = connections.length
  const currPos = useMemo(() => nodePositions.map((p) => p.clone()), [nodePositions])
  const linePos = useMemo(() => new Float32Array(totalConns * 6), [totalConns])
  const lineOp = useMemo(() => {
    const o = new Float32Array(totalConns * 2)
    for (let idx = 0; idx < totalConns; idx++) {
      const { i, j } = connections[idx]
      const d = j === -1 ? nodePositions[i].length() : nodePositions[i].distanceTo(nodePositions[j])
      const v = 0.06 + (1 - Math.min(d, 8) / 8) * 0.45
      o[idx * 2] = v; o[idx * 2 + 1] = v
    }
    return o
  }, [connections, nodePositions])

  const packets = useMemo(() => {
    const p = new Float32Array(PACKET_COUNT * 3)
    const m = []
    for (let i = 0; i < PACKET_COUNT; i++) {
      const li = Math.floor(Math.random() * totalConns)
      m.push({ li, progress: Math.random(), speed: 0.3 + Math.random() * 1.2, reverse: Math.random() > 0.5 })
      const { i: ai, j: bj } = connections[li]
      const bx = bj === -1 ? 0 : nodePositions[bj].x
      const by = bj === -1 ? 0 : nodePositions[bj].y
      const bz = bj === -1 ? 0 : nodePositions[bj].z
      p[i * 3] = nodePositions[ai].x + (bx - nodePositions[ai].x) * Math.random()
      p[i * 3 + 1] = nodePositions[ai].y + (by - nodePositions[ai].y) * Math.random()
      p[i * 3 + 2] = nodePositions[ai].z + (bz - nodePositions[ai].z) * Math.random()
    }
    return { positions: p, meta: m }
  }, [connections, nodePositions, totalConns])

  const sprites = useMemo(() => {
    return labels.map((l, i) => {
      const mat = new THREE.SpriteMaterial({
        map: textures[i],
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const sprite = new THREE.Sprite(mat)
      sprite.position.copy(nodePositions[i])
      sprite.scale.setScalar(0.15)
      return sprite
    })
  }, [textures, nodePositions, labels])

  const starPos = useMemo(() => {
    const p = new Float32Array(10000 * 3)
    for (let i = 0; i < 10000; i++) {
      p[i * 3] = (Math.random() - 0.5) * 50
      p[i * 3 + 1] = (Math.random() - 0.5) * 40
      p[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    return p
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime * 3

    if (groupRef.current) {
      const children = groupRef.current.children
      for (let i = 0; i < children.length && i < NODE_COUNT; i++) {
        const sp = children[i]
        const phase = i * 0.4
        const fy = Math.sin(t * 0.6 + phase) * 0.05
        const fx = Math.cos(t * 0.5 + phase * 1.1) * 0.035
        sp.position.x = nodePositions[i].x + fx
        sp.position.y = nodePositions[i].y + fy
        sp.position.z = nodePositions[i].z + Math.sin(t * 0.4 + phase * 0.7) * 0.025
        currPos[i].set(sp.position.x, sp.position.y, sp.position.z)
        const pulse = Math.sin(t + phase) * 0.5 + 0.5
        sp.scale.setScalar(0.12 + pulse * 0.05)
        sp.material.opacity = 0.5 + pulse * 0.5
      }
    }

    if (linesRef.current) {
      const pA = linesRef.current.geometry.attributes.position
      const pAr = pA.array
      for (let idx = 0; idx < totalConns; idx++) {
        const { i, j } = connections[idx]
        const i6 = idx * 6
        pAr[i6] = currPos[i].x; pAr[i6 + 1] = currPos[i].y; pAr[i6 + 2] = currPos[i].z
        if (j === -1) { pAr[i6 + 3] = 0; pAr[i6 + 4] = 0; pAr[i6 + 5] = 0 }
        else { pAr[i6 + 3] = currPos[j].x; pAr[i6 + 4] = currPos[j].y; pAr[i6 + 5] = currPos[j].z }
      }
      pA.needsUpdate = true

      const oA = linesRef.current.geometry.attributes.opacity
      const oAr = oA.array
      for (let i = 0; i < oAr.length; i++) {
        oAr[i] = lineOp[i] * (0.2 + 0.8 * (Math.sin(t + i * 0.006) * 0.5 + 0.5))
      }
      oA.needsUpdate = true
    }

    if (packetsRef.current) {
      const pos = packetsRef.current.geometry.attributes.position
      for (let i = 0; i < PACKET_COUNT; i++) {
        const pd = packets.meta[i]
        pd.progress = (pd.progress + pd.speed * 0.025) % 1
        const { i: ai, j: bj } = connections[pd.li]
        const ax = currPos[ai].x, ay = currPos[ai].y, az = currPos[ai].z
        let bx, by, bz
        if (bj === -1) { bx = 0; by = 0; bz = 0 }
        else { bx = currPos[bj].x; by = currPos[bj].y; bz = currPos[bj].z }
        const pr = pd.reverse ? 1 - pd.progress : pd.progress
        pos.array[i * 3] = ax + (bx - ax) * pr
        pos.array[i * 3 + 1] = ay + (by - ay) * pr
        pos.array[i * 3 + 2] = az + (bz - az) * pr
      }
      pos.needsUpdate = true
    }
  })

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={10000} array={starPos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.005} color="#00d4ff" transparent opacity={0.02}
          sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <group ref={groupRef}>
        {sprites.map((s, i) => <primitive key={i} object={s} />)}
        <AICore />
      </group>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={linePos.length / 3} array={linePos} itemSize={3} />
          <bufferAttribute attach="attributes-opacity" count={lineOp.length} array={lineOp} itemSize={1} />
        </bufferGeometry>
        <lineBasicMaterial color="#00d4ff" transparent opacity={0.12} depthWrite={false} />
      </lineSegments>

      <points ref={packetsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PACKET_COUNT} array={packets.positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#ffffff" transparent opacity={0.9}
          sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

export default function InventoryGPTNetwork() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => { gl.setClearColor(0x020b1f, 0) }}
      >
        <SceneContent />
      </Canvas>
    </div>
  )
}
