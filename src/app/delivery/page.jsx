'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import DeliveryCharts from './DeliveryCharts';

const TrackingMap = dynamic(() => import('./TrackingMap'), { ssr: false });

const KPI_CARDS = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    label: 'TOTAL SHIPMENTS', badge: { text: '+14%', color: '#16A34A', bg: '#DCFCE7' }, tone: 'neutral', sub: 'vs last month',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>,
    label: 'ACTIVE IN-TRANSIT', badge: { text: 'Live Status', color: '#2563EB', bg: '#DBEAFE' }, tone: 'blue', sub: 'Global Network Active',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    label: 'DELIVERED TODAY', badge: { text: 'Today', color: '#374151', bg: '#F3F4F6' }, tone: 'green', sub: '99.2% SLA Compliance',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    label: 'RETURN (RTO) RATE', badge: { text: 'Action Required', color: '#DC2626', bg: '#FEE2E2' }, tone: 'red', sub: 'Attention Status: High Priority',
  },
];

const AI_INSIGHTS = [
  {
    title: 'Route Congestion Alert',
    desc: 'Heavy traffic detected on NH-48 corridor affecting deliveries in Delhi-NCR region. Estimated delay:',
    highlight: '3–5 hours', highlight2: '28 shipments',
    time: 'AI CORE', actions: ['Reroute Now', 'View Details'],
  },
  {
    title: 'Delivery Optimization',
    desc: 'Cluster analysis suggests consolidating last-mile routes in Mumbai Zone B. Action could reduce fuel cost by',
    highlight: '18%', highlight2: null,
    time: 'TACTICAL SUGGESTION', actions: ['Apply Optimization', 'View Details'],
  },
  {
    title: 'Network Summary',
    desc: '"Overall fleet efficiency is currently operating at 91%. Return rates in the North-East region have spiked; analyzing warehouse latency patterns now."',
    highlight: null, highlight2: null,
    time: 'FLEET INTELLIGENCE', actions: null,
  },
];

// Demo journey points across India
const DEMO_JOURNEY = [
  { lat: 28.7041, lng: 77.1025, status: 'Picked Up',        location: 'Delhi',     scan_time: '2026-04-19T08:00:00Z' },
  { lat: 26.9124, lng: 75.7873, status: 'In Transit',       location: 'Jaipur',    scan_time: '2026-04-19T12:00:00Z' },
  { lat: 23.0225, lng: 72.5714, status: 'In Transit',       location: 'Ahmedabad', scan_time: '2026-04-19T18:00:00Z' },
  { lat: 19.0760, lng: 72.8777, status: 'Out for Delivery', location: 'Mumbai',    scan_time: '2026-04-20T09:00:00Z' },
];

export default function DeliveryPage() {
  const [awb, setAwb] = useState('');

  return (
    <div style={{ background: '#F1F5F9', fontFamily: 'Inter, sans-serif', padding: '16px' }}>

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #1E3A5F, #2563EB)',
          color: '#fff', border: 'none', borderRadius: 14,
          padding: '12px 24px', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
          transition: 'transform 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Shipment
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        {KPI_CARDS.map((card, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 20, padding: '20px 22px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
            transition: 'all 0.2s', cursor: 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: card.badge.color, background: card.badge.bg, padding: '3px 10px', borderRadius: 20 }}>{card.badge.text}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', marginBottom: 6 }}>—</div>
            <div style={{ fontSize: 12, color: card.tone === 'green' ? '#16A34A' : card.tone === 'red' ? '#DC2626' : '#64748B', fontWeight: 500 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12 }}>

        {/* MAP */}
        <div style={{ borderRadius: 18, overflow: 'hidden', height: 480, position: 'relative' }}>
          {/* Live badge */}
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 1000,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 8px #22C55E' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Live Network: Active Hubs</span>
          </div>
          <TrackingMap awb={awb} setAwb={setAwb} journey={DEMO_JOURNEY} />
        </div>

        {/* AI INSIGHTS */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '20px 20px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {AI_INSIGHTS.map((ins, i) => (
              <div key={i} style={{
                background: '#F8FAFF', borderRadius: 16, padding: '14px 16px',
                border: '1px solid #E0EAFF', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFF'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', marginBottom: 6 }}>{ins.title}</div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 4 }}>
                  {ins.desc}{' '}
                  {ins.highlight && <span style={{ color: '#DC2626', fontWeight: 700 }}>{ins.highlight}</span>}
                  {ins.highlight2 && <> for <span style={{ fontWeight: 700, color: '#0F172A' }}>{ins.highlight2}</span></>}
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', marginBottom: ins.actions ? 10 : 0 }}>• {ins.time}</div>
                {ins.actions && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
                      onMouseLeave={e => e.currentTarget.style.background = '#1E3A5F'}
                    >{ins.actions[0]}</button>
                    <button style={{ background: 'transparent', color: '#2563EB', border: '1.5px solid #BFDBFE', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
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

      {/* 3D CHARTS */}
      <DeliveryCharts />
    </div>
  );
}
