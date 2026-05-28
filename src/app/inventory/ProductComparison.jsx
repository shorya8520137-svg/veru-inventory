"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, TrendingUp, BarChart3, Package } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

export default function ProductComparison({ initialProduct1, initialProduct2, onClose }) {
  const [p1, setP1] = useState(initialProduct1 || '');
  const [p2, setP2] = useState(initialProduct2 || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComparison = useCallback(async (prod1, prod2) => {
    if (!prod1 || !prod2 || prod1.length < 2 || prod2.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE}/api/inventory/compare-products?product1=${encodeURIComponent(prod1)}&product2=${encodeURIComponent(prod2)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await res.json();
      if (d.success && d.comparison) {
        setData(d.comparison);
      } else {
        setError(d.message || 'Comparison failed');
        setData(null);
      }
    } catch (err) {
      setError('Failed to compare products');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialProduct1 && initialProduct2) fetchComparison(initialProduct1, initialProduct2);
  }, [initialProduct1, initialProduct2, fetchComparison]);

  const maxStock = data ? Math.max(data[0]?.current_stock || 0, data[1]?.current_stock || 0, 1) : 1;

  const renderBar = (value, max) => {
    const pct = max > 0 ? Math.max((value / max) * 100, 2) : 2;
    return (
      <div style={{ height:8, background:'#E5E7EB', borderRadius:4, overflow:'hidden', marginTop:4 }}>
        <div style={{ height:'100%', borderRadius:4, width:`${pct}%`, background: value > 0 ? '#2563EB' : '#9CA3AF', transition:'width 0.5s' }} />
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
            <div style={{ fontSize:16, fontWeight:700, color:'#111827' }}>
              Product Comparison
            </div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:7, border:'1px solid #E5E7EB', background:'#fff', color:'#6B7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>×</button>
        </div>

        <div style={{ display:'flex', gap:12, padding:'12px 20px', borderBottom:'1px solid #E5E7EB', flexShrink:0, alignItems:'center' }}>
          <input
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            placeholder="Product 1 name/barcode..."
            style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:13, outline:'none' }}
          />
          <span style={{ color:'#9CA3AF', fontWeight:600 }}>VS</span>
          <input
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            placeholder="Product 2 name/barcode..."
            style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:13, outline:'none' }}
          />
          <button onClick={() => fetchComparison(p1, p2)}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#2563EB', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
            {loading ? '...' : 'Compare'}
          </button>
        </div>

        {error && (
          <div style={{ padding:24, textAlign:'center', color:'#DC2626', fontSize:14 }}>{error}</div>
        )}

        {data && (
          <div style={{ flex:1, overflow:'auto', padding:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {data.map((product, idx) => {
                const movements = {};
                (product.movements || []).forEach(m => {
                  movements[m.movement_type] = parseInt(m.total_qty || 0);
                });

                return (
                  <div key={idx} style={{ border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden' }}>
                    <div style={{ padding:16, background: idx === 0 ? '#EFF6FF' : '#F0FDF4', borderBottom:'1px solid #E5E7EB' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                        Product {idx + 1}
                      </div>
                      <div style={{ fontSize:16, fontWeight:700, color:'#111827' }}>{product.name}</div>
                      <div style={{ fontSize:12, color:'#6B7280', fontFamily:'monospace' }}>{product.barcode}</div>
                      {product.price && (
                        <div style={{ fontSize:13, fontWeight:600, color:'#059669', marginTop:4 }}>
                          ₹{parseFloat(product.price).toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div style={{ padding:16 }}>
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>
                          Current Stock
                        </div>
                        <div style={{ fontSize:24, fontWeight:700, color:'#2563EB' }}>
                          {product.current_stock || 0}
                        </div>
                        {renderBar(product.current_stock || 0, maxStock)}
                      </div>

                      {(product.stock_by_location || []).length > 0 && (
                        <div style={{ marginBottom:16 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
                            By Location
                          </div>
                          {product.stock_by_location.map((loc, i) => (
                            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                              <span style={{ color:'#6B7280' }}>{loc.warehouse}</span>
                              <span style={{ fontWeight:600, color:'#374151' }}>{loc.stock}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
                          Movement Breakdown
                        </div>
                        {Object.entries(movements).length > 0 ? (
                          Object.entries(movements).map(([type, qty]) => {
                            const isIn = qty > 0;
                            return (
                              <div key={type} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                                <span style={{ color:'#6B7280' }}>{type}</span>
                                <span style={{ fontWeight:600, color: isIn ? '#059669' : '#DC2626' }}>
                                  {isIn ? '+' : ''}{qty}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ fontSize:12, color:'#9CA3AF' }}>No movement data</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading && !data && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#9CA3AF', fontSize:13 }}>
            Comparing products...
          </div>
        )}

        {!data && !loading && !error && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#9CA3AF' }}>
            <BarChart3 size={48} style={{ marginBottom:12, opacity:0.3 }} />
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Compare Two Products</div>
            <div style={{ fontSize:12 }}>Enter two product names or barcodes above to compare</div>
          </div>
        )}
      </div>
    </div>
  );
}
