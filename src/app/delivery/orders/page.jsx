'use client';
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';
const STATUS_TABS = ['All', 'Pending', 'Packed', 'Shipped', 'Delivered', 'RTO'];

const STATUS_STYLE = {
  Pending:   { color: '#1E40AF', bg: '#EFF6FF', dot: '#3B82F6' },
  Packed:    { color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  Shipped:   { color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
  Delivered: { color: '#374151', bg: '#F3F4F6', dot: '#6B7280' },
  RTO:       { color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
  Created:   { color: '#6D28D9', bg: '#EDE9FE', dot: '#7C3AED' },
};

function Avatar({ name, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];
  const bg = colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {(status || 'Pending').toUpperCase()}
    </span>
  );
}

const COLS = [
  { key: 'order_ref',       label: 'ORDER ID',      width: 130 },
  { key: 'customer',        label: 'CUSTOMER',       width: 140 },
  { key: 'customer_phone',  label: 'PHONE',          width: 120 },
  { key: 'customer_city',   label: 'CITY',           width: 100 },
  { key: 'customer_state',  label: 'STATE',          width: 100 },
  { key: 'customer_pincode',label: 'PINCODE',        width: 80  },
  { key: 'warehouse',       label: 'WAREHOUSE',      width: 100 },
  { key: 'product_name',    label: 'PRODUCT',        width: 180 },
  { key: 'barcode',         label: 'BARCODE',        width: 110 },
  { key: 'qty',             label: 'QTY',            width: 60  },
  { key: 'actual_weight',   label: 'WEIGHT',         width: 80  },
  { key: 'invoice_amount',  label: 'VALUE',          width: 100 },
  { key: 'payment_mode',    label: 'PAYMENT',        width: 90  },
  { key: 'logistics',       label: 'COURIER',        width: 110 },
  { key: 'awb',             label: 'AWB',            width: 130 },
  { key: 'shiprocket_order_id', label: 'SR ORDER',   width: 110 },
  { key: 'status',          label: 'STATUS',         width: 110 },
  { key: 'timestamp',       label: 'DATE',           width: 130 },
];

const ITEMS_PER_PAGE = 10;

export default function OrdersPage() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch]       = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [page, setPage]           = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ limit: 200 });
    if (activeTab !== 'All') params.set('status', activeTab);
    if (search) params.set('search', search);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    setLoading(true);
    fetch(`${API_BASE}/api/dispatch?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d.data) ? d.data : []); setPage(1); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab, search, dateFrom, dateTo]);

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginated  = orders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const fmt = (ts) => ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'â€”';

  const cellVal = (o, key) => {
    if (key === 'order_ref')      return <span style={{ fontWeight: 700, color: '#2563EB' }}>#{o.order_ref || `DISP-${o.id}`}</span>;
    if (key === 'customer')       return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={o.customer} /><span style={{ fontWeight: 600, color: '#0F172A' }}>{o.customer || 'â€”'}</span></div>;
    if (key === 'customer_phone') return <span style={{ color: '#374151' }}>{o.customer_phone || 'â€”'}</span>;
    if (key === 'invoice_amount') return <span style={{ fontWeight: 700 }}>â‚¹{Number(o.invoice_amount || 0).toLocaleString('en-IN')}</span>;
    if (key === 'status')         return <StatusBadge status={o.status} />;
    if (key === 'timestamp')      return <span style={{ color: '#94A3B8', fontSize: 11 }}>{fmt(o.timestamp)}</span>;
    if (key === 'actual_weight')  return <span>{o.actual_weight ? `${o.actual_weight}kg` : 'â€”'}</span>;
    if (key === 'shiprocket_order_id') return <span style={{ color: '#7C3AED', fontSize: 11 }}>{o.shiprocket_order_id || 'â€”'}</span>;
    if (key === 'awb')            return <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{o.awb || 'â€”'}</span>;
    return <span style={{ color: '#374151' }}>{o[key] || 'â€”'}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#F1F5F9', fontFamily: 'Inter, sans-serif', padding: '16px 20px', boxSizing: 'border-box' }}>

      {/* FILTER BAR */}
      <div style={{ flexShrink: 0, background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', background: activeTab === tab ? '#1E3A5F' : 'transparent',
                color: activeTab === tab ? '#fff' : '#64748B',
              }}>{tab}</button>
            ))}
          </div>
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search order, customer, AWB, barcode..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 30, paddingRight: 14, paddingTop: 8, paddingBottom: 8, borderRadius: 20, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F8FAFC', width: 280 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F8FAFC' }}/>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>â€”</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F8FAFC' }}/>
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear</button>}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8' }}>{orders.length} orders</span>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid #F1F5F9", overflow: "hidden" }}>
        <div style={{ overflowX: 'auto' }} className="scrollbar-hide">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: COLS.reduce((s, c) => s + c.width, 0) + 60 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                {COLS.map(c => (
                  <th key={c.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', whiteSpace: 'nowrap', minWidth: c.width }}>
                    {c.label}
                  </th>
                ))}
                <th style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#94A3B8', minWidth: 60 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={COLS.length + 1} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={COLS.length + 1} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>ðŸ“¦</div>
                  No orders found
                </td></tr>
              ) : paginated.map((o, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {COLS.map(c => (
                    <td key={c.key} style={{ padding: '12px 14px', whiteSpace: c.key === 'product_name' ? 'normal' : 'nowrap', maxWidth: c.key === 'product_name' ? 180 : undefined }}>
                      {cellVal(o, c.key)}
                    </td>
                  ))}
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B', padding: '4px 8px', borderRadius: 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >â‹®</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION — fixed at bottom */}
        {!loading && (
          <div style={{ flexShrink: 0, padding: '10px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Showing {orders.length === 0 ? 0 : (page-1)*ITEMS_PER_PAGE+1}–{Math.min(page*ITEMS_PER_PAGE, orders.length)} of {orders.length} orders
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                style={{ width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:page===1?'not-allowed':'pointer',color:page===1?'#CBD5E1':'#374151',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' }}>‹</button>
              {Array.from({ length: Math.min(totalPages||1, 5) }, (_, i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{
                  width:32,height:32,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',
                  background:page===p?'#1E3A5F':'#fff', color:page===p?'#fff':'#374151',
                  border:page===p?'none':'1.5px solid #E5E7EB',
                }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages||1, p+1))} disabled={page===totalPages||totalPages===0}
                style={{ width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:'pointer',color:'#374151',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' }}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
