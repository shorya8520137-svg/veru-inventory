'use client';
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

const STATUS_TABS = ['All', 'Pending', 'Shipped', 'Delivered', 'RTO'];

const STATUS_STYLE = {
  Pending:   { color: '#1E40AF', bg: '#EFF6FF', dot: '#3B82F6' },
  Shipped:   { color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
  Delivered: { color: '#374151', bg: '#F3F4F6', dot: '#6B7280' },
  RTO:       { color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
  Created:   { color: '#6D28D9', bg: '#EDE9FE', dot: '#7C3AED' },
  Packed:    { color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
};

function Avatar({ name, size = 36 }) {
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {status?.toUpperCase()}
    </span>
  );
}

const ITEMS_PER_PAGE = 10;

export default function OrdersPage() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('All');
  const [search, setSearch]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [page, setPage]             = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ limit: 200 });
    if (activeTab !== 'All') params.set('status', activeTab);
    if (search) params.set('search', search);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    setLoading(true);
    fetch(`${API_BASE}/api/dispatch?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        const rows = Array.isArray(d.data) ? d.data : d.data?.dispatches || [];
        setOrders(rows);
        setPage(1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab, search, dateFrom, dateTo]);

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginated  = orders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `Placed ${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Placed ${h}h ago`;
    return `Placed ${Math.floor(h/24)}d ago`;
  };

  return (
    <div style={{ background: '#F1F5F9', fontFamily: 'Inter, sans-serif', padding: '20px 24px', minHeight: '100vh' }}>

      {/* FILTER BAR */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '7px 18px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === tab ? '#1E3A5F' : 'transparent',
                color: activeTab === tab ? '#fff' : '#64748B',
              }}>{tab}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Search ID, Customer, or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, paddingRight: 16, paddingTop: 9, paddingBottom: 9, borderRadius: 24, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', background: '#F8FAFC', width: 260 }}
            />
          </div>
        </div>

        {/* Date filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F8FAFC' }}
          />
          <span style={{ fontSize: 12, color: '#94A3B8' }}>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F8FAFC' }}
          />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', overflow: 'hidden' }}>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 200px 150px 180px 100px 130px 60px', gap: 0, padding: '12px 24px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
          {['ORDER ID', 'CUSTOMER', 'LOCATION', 'PRODUCT DETAILS', 'VALUE', 'STATUS', 'ACTIONS'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Loading orders...</div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No orders found</div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>Try adjusting your filters or create a new order.</div>
          </div>
        ) : (
          paginated.map((o, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '160px 200px 150px 180px 100px 130px 60px',
              gap: 0, padding: '18px 24px', borderBottom: '1px solid #F8FAFC',
              transition: 'background 0.15s', cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Order ID */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>#{o.order_ref || `DISP-${o.id}`}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{timeAgo(o.timestamp)}</div>
              </div>

              {/* Customer */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Avatar name={o.customer || 'Unknown'} size={34} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{o.customer || '—'}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{o.customer_phone || '—'}</div>
                </div>
              </div>

              {/* Location */}
              <div>
                <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{o.customer_city || '—'}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{o.warehouse}</div>
              </div>

              {/* Product */}
              <div>
                <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{o.product_name || '—'}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Qty: {o.qty} • {o.actual_weight || '—'}kg</div>
              </div>

              {/* Value */}
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                ₹{Number(o.invoice_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>

              {/* Status */}
              <div><StatusBadge status={o.status || 'Pending'} /></div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#64748B', fontSize: 18, fontWeight: 700 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  title="More actions"
                >⋮</button>
              </div>
            </div>
          ))
        )}

        {/* FOOTER */}
        {!loading && orders.length > 0 && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Showing {Math.min((page-1)*ITEMS_PER_PAGE+1, orders.length)}–{Math.min(page*ITEMS_PER_PAGE, orders.length)} of {orders.length} orders
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: page===1?'not-allowed':'pointer', color: page===1?'#CBD5E1':'#374151', fontSize: 14 }}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: page===p ? '#1E3A5F' : '#fff',
                    color: page===p ? '#fff' : '#374151',
                    border: page===p ? 'none' : '1.5px solid #E5E7EB',
                  }}>{p}</button>
                );
              })}
              {totalPages > 5 && page < totalPages-2 && <span style={{ color: '#94A3B8', fontSize: 13 }}>...</span>}
              {totalPages > 5 && page < totalPages-2 && (
                <button onClick={() => setPage(totalPages)} style={{ width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,color:'#374151' }}>{totalPages}</button>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: page===totalPages?'not-allowed':'pointer', color: page===totalPages?'#CBD5E1':'#374151', fontSize: 14 }}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
