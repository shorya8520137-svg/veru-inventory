'use client';

const LEFT_CARDS = [
  {
    label: "Today's Orders", value: '0', sub: 'Yesterday', subVal: '1',
    bg: '#EDE9FE', icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
    ),
  },
  {
    label: "Today's Revenue", value: '₹0', sub: 'Yesterday', subVal: '₹1,250',
    bg: '#DCFCE7', icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
    ),
  },
  {
    label: 'Average Shipping Cost', value: '₹177', sub: 'Last 30 days', subVal: '',
    bg: '#EDE9FE', icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6"/></svg>
    ),
  },
];

const SHIPMENT_STATS = [
  { label: 'Total Shipments',  value: 29 },
  { label: 'Pickup Pending',   value: 0  },
  { label: 'In Transit',       value: 3  },
  { label: 'Delivered',        value: 22 },
  { label: 'NDR Pending',      value: 0  },
  { label: 'RTO',              value: 0  },
];

const NDR_STATS = [
  { label: 'Total NDR',              value: 3 },
  { label: 'Your Reattempt Request', value: 0 },
  { label: 'Buyer Reattempt Request',value: 0 },
  { label: 'NDR Delivered',          value: 3 },
];

const COD_STATS = [
  { label: 'Total COD\n(Last 30 Days)',          value: '₹0'      },
  { label: 'COD Available',                       value: '₹0'      },
  { label: 'COD Pending\n(Greater than 8 days)', value: '₹0'      },
  { label: 'Last COD Remitted',                   value: '₹791.09' },
];

function StatBox({ value, label }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '12px 8px',
      border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff',
      minWidth: 80,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#64748B', fontWeight: 500, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

function RightSection({ title, stats }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '16px 20px',
      border: '1px solid #F1F5F9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {stats.map((s, i) => <StatBox key={i} value={s.value} label={s.label} />)}
      </div>
    </div>
  );
}

export default function ShipmentStats() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, marginTop: 16 }}>

      {/* LEFT — metric cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LEFT_CARDS.map((card, i) => (
          <div key={i} style={{
            background: card.bg, borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            <div style={{ flexShrink: 0 }}>{card.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{card.value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                {card.sub} {card.subVal && <span style={{ color: '#374151', fontWeight: 600 }}>{card.subVal}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT — stats sections */}
      <div>
        <RightSection title="Shipments Details" stats={SHIPMENT_STATS} />
        <RightSection title="NDR Details"        stats={NDR_STATS}      />
        <RightSection title="COD Status"         stats={COD_STATS}      />
      </div>
    </div>
  );
}
