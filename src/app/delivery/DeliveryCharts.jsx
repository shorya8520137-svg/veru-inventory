'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CHARTS = [
  {
    title: 'Couriers Split',
    sub: 'Last 30 days',
    data: [
      { name: 'Blue Dart Surface',          value: 52, color: '#818CF8' },
      { name: 'Amazon Shipping Surface 2kg', value: 24, color: '#34D399' },
      { name: 'DTDC Surface 2kg',            value: 14, color: '#FB923C' },
      { name: 'Xpressbees Surface',          value: 10, color: '#F472B6' },
    ],
  },
  {
    title: 'Overall Shipment Status',
    sub: null,
    data: [
      { name: 'Delivered',    value: 68, color: '#818CF8' },
      { name: 'Intransit',    value: 18, color: '#34D399' },
      { name: 'Undelivered',  value:  7, color: '#60A5FA' },
      { name: 'RTO',          value:  5, color: '#FB923C' },
      { name: 'Lost/Damaged', value:  2, color: '#F87171' },
    ],
  },
  {
    title: 'Delivery Performance',
    sub: null,
    data: [
      { name: 'Ontime Deliveries', value: 91, color: '#818CF8' },
      { name: 'Late Deliveries',   value:  9, color: '#FB923C' },
    ],
  },
];

/* 3D effect via layered shadow + perspective wrapper */
function DonutChart3D({ data }) {
  return (
    <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
      {/* Shadow layer — gives 3D depth illusion */}
      <div style={{
        position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
        width: 160, height: 20, borderRadius: '50%',
        background: 'rgba(0,0,0,0.12)', filter: 'blur(8px)',
      }} />
      {/* Slightly tilted perspective wrapper */}
      <div style={{ transform: 'perspective(600px) rotateX(18deg)', transformOrigin: 'center bottom' }}>
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            {/* Back ring — darker, gives depth */}
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={52} outerRadius={72}
              startAngle={90} endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} opacity={0.35} />
              ))}
            </Pie>
            {/* Front ring */}
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={48} outerRadius={68}
              startAngle={90} endAngle={-270}
              dataKey="value"
              strokeWidth={1}
              stroke="#fff"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #E5E7EB' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DeliveryCharts() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
      {CHARTS.map((chart, i) => (
        <div key={i} style={{
          background: '#fff', borderRadius: 20, padding: '20px 24px 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{chart.title}</span>
            {chart.sub && <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{chart.sub}</span>}
          </div>

          {/* 3D Donut */}
          <DonutChart3D data={chart.data} />

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 16, justifyContent: 'center' }}>
            {chart.data.map((item, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
