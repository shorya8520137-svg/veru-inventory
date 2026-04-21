'use client';

const COURIERS = [
  { name: 'Blue Dart Surface',          pickupUnscheduled: 0, pickupScheduled: 0, inTransit: 4,  delivered: 15, rto: 0, lostDamaged: 0 },
  { name: 'DTDC Surface 2kg',           pickupUnscheduled: 0, pickupScheduled: 0, inTransit: 0,  delivered: 3,  rto: 0, lostDamaged: 0 },
  { name: 'Amazon Shipping Surface 2kg',pickupUnscheduled: 0, pickupScheduled: 0, inTransit: 0,  delivered: 2,  rto: 0, lostDamaged: 0 },
  { name: 'Xpressbees Surface',         pickupUnscheduled: 0, pickupScheduled: 0, inTransit: 0,  delivered: 1,  rto: 0, lostDamaged: 0 },
];

const COLS = [
  { key: 'pickupUnscheduled', label: 'Pickup Unscheduled' },
  { key: 'pickupScheduled',   label: 'Pickup Scheduled'   },
  { key: 'inTransit',         label: 'In-Transit'         },
  { key: 'delivered',         label: 'Delivered'          },
  { key: 'rto',               label: 'RTO'                },
  { key: 'lostDamaged',       label: 'Lost/Damaged'       },
];

export default function ShipmentTable() {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, marginTop: 20,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
      overflow: 'hidden',
    }}>
      {/* Title */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Shipment Overview by Courier</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>
                Courier Name
              </th>
              {COLS.map(col => (
                <th key={col.key} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {col.label}
                </th>
              ))}
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>
                Total Shipment
              </th>
            </tr>
          </thead>
          <tbody>
            {COURIERS.map((row, i) => {
              const total = COLS.reduce((s, c) => s + (row[c.key] || 0), 0);
              return (
                <tr key={i} style={{ borderTop: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 24px', color: '#374151', fontWeight: 500 }}>{row.name}</td>
                  {COLS.map(col => (
                    <td key={col.key} style={{ padding: '14px 16px', textAlign: 'center', color: col.key === 'inTransit' && row[col.key] > 0 ? '#2563EB' : col.key === 'delivered' && row[col.key] > 0 ? '#16A34A' : col.key === 'rto' && row[col.key] > 0 ? '#DC2626' : '#374151', fontWeight: row[col.key] > 0 ? 600 : 400 }}>
                      {row[col.key]}
                    </td>
                  ))}
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#0F172A' }}>{total}</td>
                </tr>
              );
            })}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr style={{ borderTop: '2px solid #E5E7EB', background: '#F8FAFC' }}>
              <td style={{ padding: '12px 24px', fontWeight: 700, color: '#0F172A', fontSize: 12 }}>Total</td>
              {COLS.map(col => {
                const sum = COURIERS.reduce((s, r) => s + (r[col.key] || 0), 0);
                return (
                  <td key={col.key} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#0F172A', fontSize: 12 }}>{sum}</td>
                );
              })}
              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#0F172A', fontSize: 12 }}>
                {COURIERS.reduce((s, r) => s + COLS.reduce((ss, c) => ss + (r[c.key] || 0), 0), 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
