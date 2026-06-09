"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, TrendingUp, MapPin, Package } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

const TYPE_BADGE = {
  OPENING:       { label:'OPENING',   bg:'#1e3a5f', color:'#93C5FD' },
  BULK_UPLOAD:   { label:'UPLOAD',    bg:'#1e3a5f', color:'#93C5FD' },
  DISPATCH:      { label:'DISPATCH',  bg:'#7f1d1d', color:'#FCA5A5' },
  SALE:          { label:'SALE',      bg:'#7f1d1d', color:'#FCA5A5' },
  DAMAGE:        { label:'DAMAGE',    bg:'#7f1d1d', color:'#FCA5A5' },
  RETURN:        { label:'RETURN',    bg:'#14532d', color:'#86EFAC' },
  RECOVER:       { label:'RECOVER',   bg:'#14532d', color:'#86EFAC' },
  SELF_TRANSFER: { label:'TRANSFER',  bg:'#312e81', color:'#C4B5FD' },
  PURCHASE:      { label:'PURCHASE',  bg:'#14532d', color:'#86EFAC' },
  MANUAL:        { label:'MANUAL',    bg:'#1E293B', color:'#94A3B8' },
};

export default function ProductJourney({ initialQuery, onClose }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedType, setExpandedType] = useState(null);

  const fetchJourney = useCallback(async (q) => {
    if (!q || q.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE}/api/inventory/product-journey?query=${encodeURIComponent(q)}&limit=200`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await res.json();
      if (d.success && d.data) {
        setData(d.data);
      } else {
        setError(d.message || 'Product not found');
        setData(null);
      }
    } catch (err) {
      setError('Failed to fetch product journey');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) fetchJourney(initialQuery);
  }, [initialQuery, fetchJourney]);

  const getBadge = (type) => TYPE_BADGE[type] || { label: type, bg:'#1E293B', color:'#94A3B8' };

  const renderChart = () => {
    if (!data || !data.journey) return null;
    const types = {};
    data.journey.forEach(e => {
      const t = e.movement_type || 'OTHER';
      if (!types[t]) types[t] = 0;
      types[t] += (e.direction === 'OUT' ? -1 : 1) * (parseInt(e.quantity) || 0);
    });
    const entries = Object.entries(types).filter(([_, v]) => v !== 0);
    const maxVal = Math.max(...entries.map(([_, v]) => Math.abs(v)), 1);

    return (
      <div style={{ background:'#F9FAFB', borderRadius:12, padding:16, border:'1px solid #E5E7EB' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>
          Net Movement by Type
        </div>
        {entries.map(([type, net]) => {
          const badge = getBadge(type);
          const pct = (Math.abs(net) / maxVal) * 100;
          const isPositive = net > 0;
          return (
            <div key={type} style={{ marginBottom: 10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                <span style={{ fontWeight:600, color:'#374151' }}>{badge.label}</span>
                <span style={{ fontWeight:700, color: isPositive ? '#059669' : '#DC2626' }}>
                  {isPositive ? '+' : ''}{net}
                </span>
              </div>
              <div style={{ height:6, background:'#E5E7EB', borderRadius:3, overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:3,
                  width: `${Math.max(pct, 2)}%`,
                  background: isPositive ? '#059669' : '#DC2626',
                  transition: 'width 0.5s'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ display:'flex', flexDirection:'column', width:'92vw', maxWidth:1100, height:'88vh', background:'#fff', borderRadius:16, overflow:'hidden', border:'1px solid #E5E7EB', boxShadow:'0 40px 100px rgba(0,0,0,0.3)' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'#F9FAFB', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:10, color:'#6B7280', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:3 }}>
              Product Intelligence
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:'#111827', letterSpacing:'-0.01em' }}>
              Product Journey — <span style={{ color:'#2563EB' }}>{data?.product?.name || query}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:7, border:'1px solid #E5E7EB', background:'#fff', color:'#6B7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>×</button>
          </div>
        </div>

        <div style={{ display:'flex', gap:12, padding:'12px 20px', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
          <div style={{ position:'relative', flex:1 }}>
            <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchJourney(query)}
              placeholder="Search product by name or barcode..."
              style={{ width:'100%', padding:'8px 12px 8px 40px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, outline:'none' }}
            />
          </div>
          <button onClick={() => fetchJourney(query)}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#2563EB', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>

        {error && (
          <div style={{ padding:24, textAlign:'center', color:'#DC2626', fontSize:14 }}>{error}</div>
        )}

        {data && (
          <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
            <div style={{ width:260, flexShrink:0, background:'#F9FAFB', borderRight:'1px solid #E5E7EB', display:'flex', flexDirection:'column', padding:'16px 14px', gap:12, overflowY:'auto' }}>

              <div style={{ background:'#EFF6FF', borderRadius:10, padding:'12px 14px', border:'1px solid #DBEAFE' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                  PRODUCT
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{data.product?.name}</div>
                <div style={{ fontSize:11, color:'#6B7280', fontFamily:'monospace' }}>{data.product?.barcode}</div>
                {data.product?.price && (
                  <div style={{ fontSize:12, fontWeight:600, color:'#059669', marginTop:4 }}>
                    ₹{parseFloat(data.product.price).toFixed(2)}
                  </div>
                )}
              </div>

              <div style={{ background:'#F0FDF4', borderRadius:10, padding:'12px 14px', border:'1px solid #D1FAE5' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                  CURRENT STOCK
                </div>
                <div style={{ fontSize:28, fontWeight:700, color:'#059669', letterSpacing:'-0.02em' }}>
                  {data.current_stock?.total || 0}
                </div>
                {data.current_stock?.by_location?.length > 0 && (
                  <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                    {data.current_stock.by_location.map((loc, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                        <span style={{ color:'#6B7280' }}>{loc.warehouse}</span>
                        <span style={{ fontWeight:600, color:'#374151' }}>{loc.stock}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background:'#FEF2F2', borderRadius:10, padding:'12px 14px', border:'1px solid #FEE2E2' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                  SUMMARY
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#6B7280' }}>Total In</span>
                    <span style={{ fontWeight:600, color:'#059669' }}>+{data.summary?.total_in || 0}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#6B7280' }}>Total Out</span>
                    <span style={{ fontWeight:600, color:'#DC2626' }}>-{data.summary?.total_out || 0}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #FEE2E2', paddingTop:4 }}>
                    <span style={{ fontWeight:600, color:'#374151' }}>Events</span>
                    <span style={{ fontWeight:700, color:'#374151' }}>{data.total_events || 0}</span>
                  </div>
                </div>
              </div>

              {renderChart()}
            </div>

            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 60px 80px', padding:'10px 20px', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
                {['DATE','EVENT','QTY','BALANCE'].map(h => (
                  <div key={h} style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>{h}</div>
                ))}
              </div>

              <div style={{ flex:1, overflowY:'auto' }}>
                {data.journey?.length > 0 ? (
                  [...data.journey].reverse().map((entry, i) => {
                    const badge = getBadge(entry.movement_type);
                    const ts = entry.timestamp || entry.created_at;
                    const date = ts ? ts.split('T')[0] : '';
                    const qty = parseInt(entry.quantity) || 0;
                    const isIn = entry.direction === 'IN';
                    const isOut = entry.direction === 'OUT';
                    const locType = entry.location_type === 'store' ? '🏪' : '🏭';
                    return (
                      <div key={`${ts}-${i}`} style={{ padding:'10px 20px', borderBottom:'1px solid #F3F4F6', display:'grid', gridTemplateColumns:'100px 1fr 60px 80px', alignItems:'center' }}
                        onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div style={{ fontSize:11, color:'#6B7280' }}>{date}</div>
                        <div>
                          <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:4, background:badge.bg, color:badge.color, fontSize:10, fontWeight:700, marginRight:6 }}>
                            {badge.label}
                          </span>
                          <span style={{ fontSize:12, color:'#374151' }}>
                            {locType} {entry.location}
                          </span>
                          {entry.reference && (
                            <div style={{ fontSize:10, color:'#9CA3AF', fontFamily:'monospace', marginTop:2 }}>
                              {entry.reference}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize:12, fontWeight:700, color: isIn ? '#059669' : isOut ? '#DC2626' : '#374151' }}>
                          {isIn ? '+' : isOut ? '-' : ''}{qty}
                        </div>
                        <div style={{ fontSize:11, color:'#6B7280' }}>
                          {entry.balance_after != null ? entry.balance_after : '—'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#9CA3AF', fontSize:13 }}>
                    <Package size={32} style={{ marginRight:8, opacity:0.3 }} />
                    No journey events found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loading && !data && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#9CA3AF', fontSize:13 }}>
            Loading product journey...
          </div>
        )}
      </div>
    </div>
  );
}
