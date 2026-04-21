'use client';
import { useState, useEffect, useRef } from 'react';

const KPI_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    ),
    label: 'TOTAL SHIPMENTS',
    badge: { text: '+14%', color: '#16A34A', bg: '#DCFCE7' },
    tone: 'neutral',
    sub: 'vs last month',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
    ),
    label: 'ACTIVE IN-TRANSIT',
    badge: { text: 'Live Status', color: '#2563EB', bg: '#DBEAFE' },
    tone: 'blue',
    sub: 'Global Network Active',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
    ),
    label: 'DELIVERED TODAY',
    badge: { text: 'Today', color: '#374151', bg: '#F3F4F6' },
    tone: 'green',
    sub: '99.2% SLA Compliance',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    ),
    label: 'RETURN (RTO) RATE',
    badge: { text: 'Action Required', color: '#DC2626', bg: '#FEE2E2' },
    tone: 'red',
    sub: 'Attention Status: High Priority',
  },
];

const AI_INSIGHTS = [
  {
    title: 'Route Congestion Alert',
    desc: 'Heavy traffic detected on NH-48 corridor affecting deliveries in Delhi-NCR region. Estimated delay:',
    highlight: '3–5 hours',
    highlight2: '28 shipments',
    time: 'AI CORE',
    actions: ['Reroute Now', 'View Details'],
  },
  {
    title: 'Delivery Optimization',
    desc: 'Cluster analysis suggests consolidating last-mile routes in Mumbai Zone B. Action could reduce fuel cost by',
    highlight: '18%',
    highlight2: null,
    time: 'TACTICAL SUGGESTION',
    actions: ['Apply Optimization', 'View Details'],
  },
  {
    title: 'Network Summary',
    desc: '"Overall fleet efficiency is currently operating at 91%. Return rates in the North-East region have spiked; analyzing warehouse latency patterns now."',
    highlight: null,
    highlight2: null,
    time: 'FLEET INTELLIGENCE',
    actions: null,
  },
];

// India GeoJSON — simplified state boundaries
const INDIA_PATHS = [
  // Jammu & Kashmir
  "M 155 28 L 170 22 L 185 25 L 192 35 L 188 48 L 175 52 L 162 48 L 155 38 Z",
  // Himachal Pradesh
  "M 175 52 L 188 48 L 195 58 L 190 68 L 178 65 L 172 58 Z",
  // Punjab
  "M 155 55 L 172 52 L 178 65 L 170 72 L 158 68 L 152 60 Z",
  // Uttarakhand
  "M 190 68 L 205 62 L 215 70 L 210 80 L 198 78 L 190 72 Z",
  // Haryana
  "M 158 68 L 170 72 L 175 82 L 165 88 L 155 82 L 152 72 Z",
  // Delhi
  "M 170 78 L 176 76 L 178 82 L 172 84 L 168 80 Z",
  // Rajasthan
  "M 130 72 L 158 68 L 165 88 L 168 110 L 155 125 L 135 128 L 118 115 L 115 95 L 122 80 Z",
  // Uttar Pradesh
  "M 175 82 L 215 70 L 235 78 L 248 92 L 240 108 L 220 118 L 198 120 L 178 112 L 168 98 L 172 86 Z",
  // Bihar
  "M 240 108 L 265 100 L 278 110 L 272 125 L 255 130 L 240 122 Z",
  // Sikkim
  "M 278 88 L 285 85 L 288 92 L 282 95 Z",
  // Arunachal Pradesh
  "M 285 72 L 320 68 L 328 80 L 315 90 L 295 92 L 282 85 Z",
  // Nagaland
  "M 315 90 L 328 88 L 332 98 L 322 102 L 312 98 Z",
  // Manipur
  "M 318 102 L 330 100 L 335 112 L 325 118 L 315 112 Z",
  // Mizoram
  "M 315 118 L 328 115 L 332 128 L 320 132 L 312 125 Z",
  // Tripura
  "M 305 118 L 315 115 L 318 128 L 308 132 L 302 125 Z",
  // Meghalaya
  "M 278 108 L 298 105 L 305 115 L 295 120 L 278 118 Z",
  // Assam
  "M 278 92 L 315 88 L 318 102 L 305 108 L 278 108 Z",
  // West Bengal
  "M 255 108 L 278 108 L 278 130 L 268 148 L 255 145 L 248 128 L 250 115 Z",
  // Jharkhand
  "M 240 122 L 258 118 L 265 135 L 255 145 L 240 140 L 232 130 Z",
  // Odisha
  "M 240 140 L 258 135 L 268 148 L 265 168 L 248 175 L 235 165 L 230 150 Z",
  // Chhattisgarh
  "M 198 120 L 232 118 L 240 140 L 232 158 L 215 162 L 200 150 L 195 135 Z",
  // Madhya Pradesh
  "M 155 125 L 198 120 L 200 150 L 185 162 L 162 158 L 148 145 L 145 130 Z",
  // Gujarat
  "M 100 108 L 130 105 L 145 118 L 148 138 L 135 150 L 115 148 L 100 135 L 95 120 Z",
  // Maharashtra
  "M 145 130 L 185 128 L 200 150 L 195 172 L 175 182 L 155 178 L 138 165 L 132 148 Z",
  // Telangana
  "M 200 150 L 232 148 L 238 168 L 225 182 L 208 185 L 198 172 Z",
  // Andhra Pradesh
  "M 208 185 L 238 175 L 248 192 L 240 210 L 222 215 L 205 205 L 200 192 Z",
  // Karnataka
  "M 155 178 L 195 172 L 205 192 L 198 212 L 180 220 L 162 215 L 148 200 L 148 185 Z",
  // Goa
  "M 148 195 L 158 192 L 160 200 L 150 202 Z",
  // Kerala
  "M 162 215 L 180 220 L 178 242 L 165 248 L 155 238 L 155 222 Z",
  // Tamil Nadu
  "M 180 220 L 205 215 L 215 232 L 210 252 L 195 260 L 178 255 L 168 242 L 172 228 Z",
  // Lakshadweep
  "M 130 235 L 133 232 L 136 235 L 133 238 Z",
  // Andaman & Nicobar
  "M 310 195 L 314 190 L 318 195 L 315 205 L 310 202 Z",
];

// City dots on India map
const CITIES = [
  { name: 'Delhi', x: 172, y: 80, active: true },
  { name: 'Mumbai', x: 148, y: 168 },
  { name: 'Bangalore', x: 175, y: 210 },
  { name: 'Chennai', x: 200, y: 228 },
  { name: 'Kolkata', x: 262, y: 130 },
  { name: 'Hyderabad', x: 215, y: 175 },
  { name: 'Pune', x: 158, y: 162 },
  { name: 'Ahmedabad', x: 118, y: 125 },
  { name: 'Jaipur', x: 148, y: 95 },
  { name: 'Lucknow', x: 205, y: 95 },
];

// Route lines between cities
const ROUTES = [
  { from: { x: 172, y: 80 }, to: { x: 148, y: 168 }, active: true },
  { from: { x: 172, y: 80 }, to: { x: 262, y: 130 } },
  { from: { x: 148, y: 168 }, to: { x: 175, y: 210 } },
  { from: { x: 175, y: 210 }, to: { x: 200, y: 228 } },
  { from: { x: 262, y: 130 }, to: { x: 215, y: 175 } },
  { from: { x: 148, y: 168 }, to: { x: 118, y: 125 } },
];

export default function DeliveryPage() {
  const [activeHub, setActiveHub] = useState(null);
  const [animOffset, setAnimOffset] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAnimOffset(p => (p + 1) % 100), 50);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: '#F1F5F9', fontFamily: 'Inter, sans-serif', padding: '28px 32px' }}>

      {/* CREATE SHIPMENT BUTTON — top right only */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #1E3A5F, #2563EB)',
          color: '#fff', border: 'none', borderRadius: 14,
          padding: '12px 24px', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Shipment
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {KPI_CARDS.map((card, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 20, padding: '20px 22px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #F1F5F9',
            transition: 'all 0.2s', cursor: 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: card.badge.color, background: card.badge.bg, padding: '3px 10px', borderRadius: 20 }}>
                {card.badge.text}
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', marginBottom: 6 }}>—</div>
            <div style={{ fontSize: 12, color: card.tone === 'green' ? '#16A34A' : card.tone === 'red' ? '#DC2626' : '#64748B', fontWeight: 500 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* LEFT — MAP */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
          <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0A1628 0%, #0D2137 50%, #0A1E35 100%)', borderRadius: 18, overflow: 'hidden', minHeight: 480 }}>

            {/* Live badge */}
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 8px #22C55E' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Live Network: Active Hubs</span>
            </div>

            {/* SVG India Map */}
            <svg viewBox="80 20 270 260" style={{ width: '100%', height: '100%', minHeight: 440 }}>
              <defs>
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0A1628" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Glow background */}
              <ellipse cx="200" cy="150" rx="120" ry="130" fill="url(#mapGlow)" />

              {/* State paths */}
              {INDIA_PATHS.map((d, i) => (
                <path key={i} d={d}
                  fill="rgba(30,64,175,0.25)"
                  stroke="rgba(96,165,250,0.5)"
                  strokeWidth="0.8"
                  style={{ transition: 'fill 0.2s' }}
                  onMouseEnter={e => e.target.setAttribute('fill', 'rgba(59,130,246,0.45)')}
                  onMouseLeave={e => e.target.setAttribute('fill', 'rgba(30,64,175,0.25)')}
                />
              ))}

              {/* Route lines */}
              {ROUTES.map((r, i) => (
                <line key={i}
                  x1={r.from.x} y1={r.from.y} x2={r.to.x} y2={r.to.y}
                  stroke={r.active ? '#60A5FA' : 'rgba(148,163,184,0.4)'}
                  strokeWidth={r.active ? 1.5 : 0.8}
                  strokeDasharray={r.active ? '4 3' : '2 4'}
                  filter={r.active ? 'url(#glow)' : ''}
                  style={{ strokeDashoffset: r.active ? -animOffset : 0 }}
                />
              ))}

              {/* City dots */}
              {CITIES.map((city, i) => (
                <g key={i} style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setActiveHub(city.name)}
                  onMouseLeave={() => setActiveHub(null)}
                >
                  <circle cx={city.x} cy={city.y} r={city.active ? 7 : 5}
                    fill={city.active ? '#3B82F6' : '#1E40AF'}
                    stroke={city.active ? '#93C5FD' : '#60A5FA'}
                    strokeWidth="1.5"
                    filter="url(#glow)"
                  />
                  {city.active && (
                    <circle cx={city.x} cy={city.y} r={12}
                      fill="none" stroke="#3B82F6" strokeWidth="1"
                      opacity="0.4"
                    />
                  )}
                  <text x={city.x + 8} y={city.y + 4}
                    fill={activeHub === city.name ? '#93C5FD' : 'rgba(148,163,184,0.8)'}
                    fontSize="7" fontWeight="600"
                  >
                    {city.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* RIGHT — AI INSIGHTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '20px 20px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>AI Insights</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em' }}>ACTIVE ANALYZER</span>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>

            {/* Insight cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {AI_INSIGHTS.map((ins, i) => (
                <div key={i} style={{
                  background: '#F8FAFF', borderRadius: 16, padding: '14px 16px',
                  border: '1px solid #E0EAFF',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFF'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', marginBottom: 6 }}>{ins.title}</div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: ins.highlight ? 4 : 0 }}>
                    {ins.desc}{' '}
                    {ins.highlight && <span style={{ color: '#DC2626', fontWeight: 700 }}>{ins.highlight}</span>}
                    {ins.highlight2 && <> for <span style={{ fontWeight: 700, color: '#0F172A' }}>{ins.highlight2}</span></>}
                    {ins.desc.startsWith('"') ? '' : '.'}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', marginBottom: ins.actions ? 10 : 0 }}>
                    • {ins.time}
                  </div>
                  {ins.actions && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{
                        background: '#1E3A5F', color: '#fff', border: 'none',
                        borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#1E3A5F'}
                      >{ins.actions[0]}</button>
                      <button style={{
                        background: 'transparent', color: '#2563EB',
                        border: '1.5px solid #BFDBFE', borderRadius: 8,
                        padding: '6px 12px', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >{ins.actions[1]}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
