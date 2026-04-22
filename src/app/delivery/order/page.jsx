'use client';
import { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

const inp = {
  width:'100%', padding:'9px 12px', borderRadius:8,
  border:'1.5px solid #E5E7EB', fontSize:13, color:'#374151',
  background:'#F8FAFC', outline:'none', boxSizing:'border-box',
};
const lbl = { fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.07em', marginBottom:4, display:'block' };
const card = { background:'#fff', borderRadius:16, padding:'20px 24px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', border:'1px solid #F1F5F9', marginBottom:16 };

const STATUS_COLOR = { Delivered:'#16A34A','In Transit':'#2563EB',Pending:'#F59E0B',RTO:'#DC2626',Created:'#7C3AED' };
const STATUS_BG    = { Delivered:'#DCFCE7','In Transit':'#DBEAFE',Pending:'#FEF3C7',RTO:'#FEE2E2',Created:'#EDE9FE' };

export default function OrderPage() {
  const [view, setView]         = useState('form');
  const [payment, setPayment]   = useState('COD');
  const [qty, setQty]           = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders]     = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]   = useState(false);
  const sugRef = useRef(null);

  const [form, setForm] = useState({
    warehouse:'', orderRef:'', customer:'', customerPhone:'', customerEmail:'',
    customerAddress:'', customerCity:'', customerState:'', customerPincode:'',
    productName:'', barcode:'', unitPrice:'', discount:'0', tax:'18', hsn:'',
    deadWeight:'0.50', packageType:'Standard Corrugated Box', l:'10', b:'10', h:'10',
    logistics:'', remarks:'',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const volWeight = ((Number(form.l)||10)*(Number(form.b)||10)*(Number(form.h)||10)/5000).toFixed(2);
  const token = () => localStorage.getItem('token');

  // Load warehouses
  useEffect(() => {
    fetch(`${API}/api/dispatch/warehouses`, { headers:{ Authorization:`Bearer ${token()}` } })
      .then(r=>r.json()).then(d=>setWarehouses(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);

  // Product search suggestions
  const searchProducts = async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); setShowSug(false); return; }
    try {
      const r = await fetch(`${API}/api/dispatch/search-products?query=${encodeURIComponent(q)}&warehouse=${form.warehouse}`, {
        headers:{ Authorization:`Bearer ${token()}` }
      });
      const d = await r.json();
      setSuggestions(Array.isArray(d)?d:d.data||[]);
      setShowSug(true);
    } catch {}
  };

  const selectProduct = (p) => {
    const name = p.product_name || p.name || '';
    const bar  = p.barcode || p.code || '';
    const price= p.price || p.selling_price || '';
    set('productName', name); set('barcode', bar); set('unitPrice', price);
    setSuggestions([]); setShowSug(false);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => { if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleShip = async () => {
    if (!form.warehouse || !form.customer || !form.productName || !form.barcode) {
      alert('Please fill: Warehouse, Customer Name, Product'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/dispatch/create`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token()}` },
        body: JSON.stringify({
          selectedWarehouse: form.warehouse,
          orderRef:          form.orderRef || `ORD-${Date.now()}`,
          customerName:      form.customer,
          customer_phone:    form.customerPhone,
          customer_email:    form.customerEmail,
          customer_address:  form.customerAddress,
          customer_city:     form.customerCity,
          customer_state:    form.customerState,
          customer_pincode:  form.customerPincode,
          awbNumber:         form.orderRef || `AWB-${Date.now()}`,
          selectedLogistics: form.logistics,
          selectedPaymentMode: payment,
          parcelType:        'Forward',
          invoiceAmount:     form.unitPrice,
          weight:            form.deadWeight,
          dimensions:        { length:form.l, width:form.b, height:form.h },
          remarks:           form.remarks,
          products: [{
            name: `${form.productName} | | ${form.barcode}`,
            qty,
          }],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => [{
          id:          data.dispatch_id,
          customer:    form.customer,
          phone:       form.customerPhone,
          city:        form.customerCity,
          product:     form.productName,
          payment,
          status:      'Created',
          value:       `₹${(Number(form.unitPrice)*qty).toFixed(2)}`,
          date:        new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
          shiprocket:  data.shiprocket_order_id || '—',
        }, ...prev]);
        setView('table');
      } else {
        alert('Error: ' + (data.message || 'Failed'));
      }
    } catch(e) { alert('Network error: ' + e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ background:'#F1F5F9', fontFamily:'Inter,sans-serif', padding:'16px 24px' }}>

      {/* TABS */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:0, background:'#fff', borderRadius:12, padding:4, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          {['domestic','international'].map(t=>(
            <button key={t} style={{ padding:'7px 20px', borderRadius:9, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:t==='domestic'?'#2563EB':'transparent', color:t==='domestic'?'#fff':'#64748B' }}>
              {t==='domestic'?'Domestic Order':'International Order'}
            </button>
          ))}
        </div>
        {view==='table' && (
          <button onClick={()=>setView('form')} style={{ marginLeft:'auto', background:'#2563EB', color:'#fff', border:'none', borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + New Order
          </button>
        )}
      </div>

      {view==='form' ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, alignItems:'start' }}>
          <div>

            {/* WAREHOUSE SELECTION */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Pickup Warehouse</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>SELECT WAREHOUSE</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.warehouse} onChange={e=>set('warehouse',e.target.value)}>
                    <option value="">— Select Warehouse —</option>
                    {warehouses.map((w,i)=>(
                      <option key={i} value={w.warehouse_code||w.code||w}>{w.Warehouse_name||w.name||w.warehouse_code||w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>ORDER REFERENCE</label>
                  <input style={inp} placeholder="Auto-generated if empty" value={form.orderRef} onChange={e=>set('orderRef',e.target.value)}/>
                </div>
              </div>
              {form.warehouse && (
                <div style={{ marginTop:10, background:'#F0FDF4', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#16A34A', fontWeight:600 }}>
                  ✓ Warehouse selected: {form.warehouse}
                </div>
              )}
            </div>

            {/* DELIVERY DETAILS */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Delivery Details</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lbl}>CUSTOMER NAME *</label><input style={inp} placeholder="Full name" value={form.customer} onChange={e=>set('customer',e.target.value)}/></div>
                <div><label style={lbl}>MOBILE NUMBER *</label><input style={inp} placeholder="10-digit number" value={form.customerPhone} onChange={e=>set('customerPhone',e.target.value)}/></div>
              </div>
              <div style={{ marginTop:12 }}><label style={lbl}>COMPLETE ADDRESS</label><input style={inp} placeholder="House/Flat No, Building, Street" value={form.customerAddress} onChange={e=>set('customerAddress',e.target.value)}/></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                <div><label style={lbl}>PINCODE</label><input style={inp} placeholder="6-digit code" value={form.customerPincode} onChange={e=>set('customerPincode',e.target.value)}/></div>
                <div><label style={lbl}>CITY</label><input style={inp} placeholder="City" value={form.customerCity} onChange={e=>set('customerCity',e.target.value)}/></div>
                <div><label style={lbl}>STATE</label><input style={inp} placeholder="State" value={form.customerState} onChange={e=>set('customerState',e.target.value)}/></div>
                <div><label style={lbl}>EMAIL (OPTIONAL)</label><input style={inp} placeholder="email@example.com" value={form.customerEmail} onChange={e=>set('customerEmail',e.target.value)}/></div>
              </div>
            </div>

            {/* PRODUCT DETAILS */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Product Details</span>
              </div>
              {/* Product search with suggestions */}
              <div ref={sugRef} style={{ position:'relative', marginBottom:12 }}>
                <label style={lbl}>PRODUCT NAME / BARCODE *</label>
                <input style={inp} placeholder="Type to search products..." value={form.productName}
                  onChange={e=>{ set('productName',e.target.value); searchProducts(e.target.value); }}
                  onFocus={()=>form.productName.length>=2&&setShowSug(true)}
                />
                {showSug && suggestions.length>0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:100, maxHeight:200, overflowY:'auto' }}>
                    {suggestions.map((p,i)=>(
                      <div key={i} onClick={()=>selectProduct(p)} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #F1F5F9', fontSize:13 }}
                        onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                        onMouseLeave={e=>e.currentTarget.style.background='#fff'}
                      >
                        <div style={{ fontWeight:600, color:'#0F172A' }}>{p.product_name||p.name}</div>
                        <div style={{ fontSize:11, color:'#94A3B8' }}>Barcode: {p.barcode||p.code} | Stock: {p.available_stock||p.stock||0}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12 }}>
                <div><label style={lbl}>BARCODE / SKU</label><input style={{ ...inp, background:'#F1F5F9' }} value={form.barcode} readOnly placeholder="Auto-filled from search"/></div>
                <div><label style={lbl}>UNIT PRICE</label><input style={inp} placeholder="₹0.00" value={form.unitPrice} onChange={e=>set('unitPrice',e.target.value)}/></div>
                <div>
                  <label style={lbl}>QUANTITY</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
                    <span style={{ fontSize:14,fontWeight:700,minWidth:24,textAlign:'center' }}>{qty}</span>
                    <button onClick={()=>setQty(q=>q+1)} style={{ width:32,height:32,borderRadius:8,border:'1.5px solid #2563EB',background:'#EFF6FF',color:'#2563EB',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* PACKAGE */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Package Dimensions & Weight</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div><label style={lbl}>DEAD WEIGHT (KG)</label><input style={inp} value={form.deadWeight} onChange={e=>set('deadWeight',e.target.value)}/></div>
                <div>
                  <label style={lbl}>PACKAGE TYPE</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.packageType} onChange={e=>set('packageType',e.target.value)}>
                    <option>Standard Corrugated Box</option>
                    <option>Bubble Wrap Envelope</option>
                    <option>Poly Bag</option>
                    <option>Wooden Crate</option>
                  </select>
                </div>
                <div><label style={lbl}>VOLUMETRIC WEIGHT</label><input style={{ ...inp, background:'#F1F5F9', color:'#64748B' }} value={`${volWeight} kg`} readOnly/></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:12 }}>
                <div><label style={lbl}>L (CM)</label><input style={inp} value={form.l} onChange={e=>set('l',e.target.value)}/></div>
                <div><label style={lbl}>B (CM)</label><input style={inp} value={form.b} onChange={e=>set('b',e.target.value)}/></div>
                <div><label style={lbl}>H (CM)</label><input style={inp} value={form.h} onChange={e=>set('h',e.target.value)}/></div>
              </div>
              <div style={{ marginTop:12, background:'#EFF6FF', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#1E40AF', fontWeight:600 }}>
                📦 Applicable Weight: {Math.max(Number(form.deadWeight)||0, Number(volWeight))} kg
              </div>
            </div>

            {/* PAYMENT */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Payment Method</span>
              </div>
              <div style={{ display:'flex', gap:24 }}>
                {['COD','Prepaid'].map(p=>(
                  <label key={p} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color:payment===p?'#2563EB':'#374151' }}>
                    <input type="radio" name="payment" checked={payment===p} onChange={()=>setPayment(p)} style={{ accentColor:'#2563EB' }}/>
                    {p==='COD'?'Cash on Delivery (COD)':'Prepaid'}
                  </label>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:12, paddingBottom:24 }}>
              <button style={{ padding:'11px 28px', borderRadius:12, border:'1.5px solid #E5E7EB', background:'#fff', fontSize:14, fontWeight:700, color:'#374151', cursor:'pointer' }}>
                Save Draft
              </button>
              <button onClick={handleShip} disabled={submitting} style={{ padding:'11px 32px', borderRadius:12, border:'none', background: submitting?'#94A3B8':'linear-gradient(135deg,#1E3A5F,#2563EB)', color:'#fff', fontSize:14, fontWeight:700, cursor: submitting?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(37,99,235,0.35)' }}>
                {submitting ? 'Creating...' : 'Ship Now'}
              </button>
            </div>
          </div>

          {/* RIGHT — AI + SUMMARY */}
          <div style={{ position:'sticky', top:16 }}>
            <div style={{ background:'#fff', borderRadius:16, padding:'16px 18px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:'1px solid #F1F5F9', marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#7C3AED', letterSpacing:'0.06em', marginBottom:12 }}>✦ PRECISION ARCHITECT AI</div>
              {[
                { type:'error',   icon:'⚠', text:'Delivery phone number required for RTO protection.' },
                { type:'warning', icon:'●', text:'Verify weight to avoid courier surcharges.' },
                { type:'success', icon:'✓', text:'Warehouse selected — ready for dispatch.' },
              ].map((h,i)=>(
                <div key={i} style={{ display:'flex', gap:10, marginBottom:8, padding:'8px 10px', borderRadius:8, background:h.type==='error'?'#FEF2F2':h.type==='warning'?'#FFFBEB':'#F0FDF4', border:`1px solid ${h.type==='error'?'#FECACA':h.type==='warning'?'#FDE68A':'#BBF7D0'}` }}>
                  <span style={{ fontSize:12, color:h.type==='error'?'#DC2626':h.type==='warning'?'#D97706':'#16A34A' }}>{h.icon}</span>
                  <span style={{ fontSize:11, color:'#374151', lineHeight:1.5 }}>{h.text}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'linear-gradient(135deg,#1E3A5F,#1E40AF)', borderRadius:16, padding:'18px 20px', color:'#fff' }}>
              <div style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>Order Summary</div>
              {[
                { label:'Subtotal',       val:`₹${(Number(form.unitPrice||0)*qty).toFixed(2)}` },
                { label:'Shipping',       val:'Calculated at dispatch' },
                { label:'Payment',        val:payment },
              ].map((r,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8, opacity:0.85 }}>
                  <span>{r.label}</span><span>{r.val}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:10, paddingTop:10 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', opacity:0.7, marginBottom:4 }}>TOTAL</div>
                <div style={{ fontSize:22, fontWeight:900 }}>₹{(Number(form.unitPrice||0)*qty).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* TABLE VIEW */
        <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #F1F5F9', overflow:'hidden' }}>
          <div style={{ padding:'16px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Orders Created This Session</span>
            <span style={{ fontSize:12, color:'#94A3B8' }}>{orders.length} orders</span>
          </div>
          {orders.length===0 ? (
            <div style={{ padding:'48px', textAlign:'center', color:'#94A3B8' }}>No orders yet.</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    {['Dispatch ID','Customer','Phone','City','Product','Payment','Status','Value','Date','Shiprocket ID'].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#64748B', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o,i)=>(
                    <tr key={i} style={{ borderTop:'1px solid #F1F5F9' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'11px 14px', fontWeight:600, color:'#2563EB' }}>{o.id}</td>
                      <td style={{ padding:'11px 14px', fontWeight:500, color:'#0F172A' }}>{o.customer}</td>
                      <td style={{ padding:'11px 14px', color:'#64748B' }}>{o.phone}</td>
                      <td style={{ padding:'11px 14px', color:'#374151' }}>{o.city}</td>
                      <td style={{ padding:'11px 14px', color:'#374151' }}>{o.product}</td>
                      <td style={{ padding:'11px 14px', color:'#374151' }}>{o.payment}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ fontSize:10, fontWeight:700, color:STATUS_COLOR[o.status]||'#374151', background:STATUS_BG[o.status]||'#F3F4F6', padding:'3px 10px', borderRadius:20 }}>{o.status}</span>
                      </td>
                      <td style={{ padding:'11px 14px', fontWeight:700, color:'#0F172A' }}>{o.value}</td>
                      <td style={{ padding:'11px 14px', color:'#94A3B8' }}>{o.date}</td>
                      <td style={{ padding:'11px 14px', color:'#7C3AED', fontSize:11 }}>{o.shiprocket}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AUTO-SAVE */}
      {view==='form' && (
        <div style={{ position:'fixed', bottom:20, left:240, background:'#0F172A', color:'#fff', borderRadius:20, padding:'8px 16px', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
          <span style={{ width:8,height:8,borderRadius:'50%',background:'#22C55E',display:'inline-block' }}/>
          Auto-saving order draft...
        </div>
      )}
    </div>
  );
}
