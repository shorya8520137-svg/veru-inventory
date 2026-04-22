'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #E5E7EB', fontSize: 13, color: '#374151',
  background: '#F8FAFC', outline: 'none', boxSizing: 'border-box',
};

const label = { fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', marginBottom: 4, display: 'block' };

const card = {
  background: '#fff', borderRadius: 16, padding: '20px 24px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', marginBottom: 16,
};

const AI_HINTS = [
  { type: 'error',   icon: '⚠', text: 'Missing Field Detected — Delivery phone number is required for RTO protection.' },
  { type: 'warning', icon: '●', text: 'Weight Suggestion — 0.5kg seems low for "Corrugated Box". Consider verifying weight to avoid surcharges.' },
  { type: 'success', icon: '✓', text: 'Address Verified — Pickup location is valid for express pickup service.' },
];

export default function OrderPage() {
  const router = useRouter();
  const [orderType, setOrderType] = useState('domestic');
  const [subTab, setSubTab]       = useState('single');
  const [view, setView]           = useState('form');
  const [payment, setPayment]     = useState('prepaid');
  const [qty, setQty]             = useState(1);
  const [submittedOrders, setSubmittedOrders] = useState([]);
  const [form, setForm]           = useState({
    mobile:'', name:'', address:'', landmark:'', pincode:'', city:'', state:'', altPhone:'', email:'',
    productName:'', unitPrice:'', discount:'0', tax:'18', hsn:'',
    deadWeight:'0.50', packageType:'Standard Corrugated Box', l:'10', b:'10', h:'10',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const volWeight = ((Number(form.l)||10) * (Number(form.b)||10) * (Number(form.h)||10) / 5000).toFixed(2);

  const handleShip = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          customer_name:    form.name,
          customer_phone:   form.mobile,
          customer_email:   form.email,
          customer_address: form.address,
          customer_city:    form.city,
          customer_state:   form.state,
          customer_pincode: form.pincode,
          customer_landmark:form.landmark,
          product_name:     form.productName,
          unit_price:       form.unitPrice,
          quantity:         qty,
          discount:         form.discount,
          tax:              form.tax,
          hsn_code:         form.hsn,
          dead_weight:      form.deadWeight,
          package_type:     form.packageType,
          length_cm:        form.l,
          breadth_cm:       form.b,
          height_cm:        form.h,
          payment_method:   payment === 'cod' ? 'COD' : 'Prepaid',
          order_type:       orderType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newOrder = {
          id:          data.data.order_id,
          customer:    form.name    || '—',
          phone:       form.mobile  || '—',
          address:     form.address || '—',
          city:        form.city    || '—',
          state:       form.state   || '—',
          pincode:     form.pincode || '—',
          email:       form.email   || '—',
          product:     form.productName || '—',
          unitPrice:   form.unitPrice || '0',
          qty,
          discount:    form.discount,
          tax:         form.tax,
          hsn:         form.hsn || '—',
          weight:      form.deadWeight,
          packageType: form.packageType,
          payment:     payment === 'cod' ? 'COD' : 'Prepaid',
          status:      data.data.status || 'Pending',
          courier:     '—',
          value:       form.unitPrice ? `₹${(Number(form.unitPrice) * qty).toFixed(2)}` : '₹0',
          date:        new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
          shiprocket_order_id: data.data.shiprocket_order_id || null,
        };
        setSubmittedOrders(prev => [newOrder, ...prev]);
        setView('table');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to create order. Please try again.');
    }
  };

  const allOrders = submittedOrders;

  const STATUS_COLOR = { Delivered:'#16A34A', 'In Transit':'#2563EB', Pending:'#F59E0B', RTO:'#DC2626' };
  const STATUS_BG    = { Delivered:'#DCFCE7', 'In Transit':'#DBEAFE', Pending:'#FEF3C7', RTO:'#FEE2E2' };

  return (
    <div style={{ background:'#F1F5F9', fontFamily:'Inter,sans-serif', padding:'16px 24px' }}>

      {/* TABS ROW — no heading */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:0, background:'#fff', borderRadius:12, padding:4, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          {['domestic','international'].map(t => (
            <button key={t} onClick={() => setOrderType(t)} style={{
              padding:'7px 20px', borderRadius:9, border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
              background: orderType===t ? '#2563EB' : 'transparent',
              color: orderType===t ? '#fff' : '#64748B', transition:'all 0.15s',
            }}>{t === 'domestic' ? 'Domestic Order' : 'International Order'}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['single','bulk'].map(t => (
            <button key={t} onClick={() => setSubTab(t)} style={{
              padding:'6px 18px', borderRadius:20, border:`1.5px solid ${subTab===t?'#2563EB':'#E5E7EB'}`,
              background: subTab===t ? '#EFF6FF' : '#fff', color: subTab===t ? '#2563EB' : '#64748B',
              fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s',
            }}>{t === 'single' ? 'Single Order' : 'Bulk Order'}</button>
          ))}
        </div>
        {view === 'table' && (
          <button onClick={() => setView('form')} style={{ marginLeft:'auto', background:'#2563EB', color:'#fff', border:'none', borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + New Order
          </button>
        )}
      </div>

      {view === 'form' ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, alignItems:'start' }}>

          {/* LEFT — FORM */}
          <div>
            {/* PICKUP ADDRESS */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Pickup Address</span>
                <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'#16A34A', background:'#DCFCE7', padding:'2px 10px', borderRadius:20 }}>● VERIFIED</span>
                <button style={{ fontSize:12, color:'#2563EB', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Edit</button>
              </div>
              <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#374151', lineHeight:1.7 }}>
                <strong>Warehouse Hub – West Sector</strong><br/>
                42nd Logistica Lane, Industrial Estate Phase II, Bengaluru, Karnataka – 560001<br/>
                Contact: +91 98765 43210
              </div>
            </div>

            {/* DELIVERY DETAILS */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Delivery Details</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={label}>CUSTOMER NAME</label><input style={inp} placeholder="Enter name" value={form.name} onChange={e=>set('name',e.target.value)}/></div>
                <div><label style={label}>MOBILE NUMBER</label><input style={inp} placeholder="10-digit number" value={form.mobile} onChange={e=>set('mobile',e.target.value)}/></div>
              </div>
              <div style={{ marginTop:12 }}><label style={label}>COMPLETE ADDRESS</label><input style={inp} placeholder="House/Flat No, Building, Street" value={form.address} onChange={e=>set('address',e.target.value)}/></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                <div><label style={label}>PINCODE</label><input style={inp} placeholder="6-digit code" value={form.pincode} onChange={e=>set('pincode',e.target.value)}/></div>
                <div><label style={label}>CITY</label><input style={inp} placeholder="Auto-detected" value={form.city} onChange={e=>set('city',e.target.value)}/></div>
                <div><label style={label}>STATE</label><input style={inp} placeholder="Select state" value={form.state} onChange={e=>set('state',e.target.value)}/></div>
                <div><label style={label}>LANDMARK (OPTIONAL)</label><input style={inp} placeholder="Nearby point" value={form.landmark} onChange={e=>set('landmark',e.target.value)}/></div>
              </div>
              <div style={{ marginTop:12 }}><label style={label}>EMAIL ADDRESS</label><input style={inp} placeholder="for order tracking updates" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
              <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, fontSize:12, color:'#374151', cursor:'pointer' }}>
                <input type="checkbox" style={{ accentColor:'#2563EB' }}/> Billing details same as delivery
              </label>
            </div>

            {/* PRODUCT DETAILS */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Product Details</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12 }}>
                <div><label style={label}>PRODUCT NAME</label><input style={inp} placeholder="Item description" value={form.productName} onChange={e=>set('productName',e.target.value)}/></div>
                <div><label style={label}>UNIT PRICE</label><input style={inp} placeholder="₹0.00" value={form.unitPrice} onChange={e=>set('unitPrice',e.target.value)}/></div>
                <div>
                  <label style={label}>QUANTITY</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #E5E7EB', background:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <span style={{ fontSize:14, fontWeight:700, minWidth:24, textAlign:'center' }}>{qty}</span>
                    <button onClick={()=>setQty(q=>q+1)} style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #2563EB', background:'#EFF6FF', color:'#2563EB', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  </div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:12 }}>
                <div><label style={label}>DISCOUNT (%)</label><input style={inp} value={form.discount} onChange={e=>set('discount',e.target.value)}/></div>
                <div><label style={label}>TAX (GST %)</label><input style={inp} value={form.tax} onChange={e=>set('tax',e.target.value)}/></div>
                <div><label style={label}>HSN CODE</label><input style={inp} placeholder="Optional" value={form.hsn} onChange={e=>set('hsn',e.target.value)}/></div>
              </div>
              <button style={{ marginTop:14, display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#2563EB', background:'none', border:'none', cursor:'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Another Product
              </button>
            </div>

            {/* PACKAGE */}
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Package Dimensions & Weight</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div><label style={label}>DEAD WEIGHT (KG)</label><input style={inp} value={form.deadWeight} onChange={e=>set('deadWeight',e.target.value)}/></div>
                <div>
                  <label style={label}>PACKAGE TYPE</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.packageType} onChange={e=>set('packageType',e.target.value)}>
                    <option>Standard Corrugated Box</option>
                    <option>Bubble Wrap Envelope</option>
                    <option>Poly Bag</option>
                    <option>Wooden Crate</option>
                  </select>
                </div>
                <div><label style={label}>VOLUMETRIC WEIGHT</label><input style={{ ...inp, background:'#F1F5F9', color:'#64748B' }} value={`Calculated: ${volWeight} kg`} readOnly/></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:12 }}>
                <div><label style={label}>L (CM)</label><input style={inp} value={form.l} onChange={e=>set('l',e.target.value)}/></div>
                <div><label style={label}>B (CM)</label><input style={inp} value={form.b} onChange={e=>set('b',e.target.value)}/></div>
                <div><label style={label}>H (CM)</label><input style={inp} value={form.h} onChange={e=>set('h',e.target.value)}/></div>
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
                {['cod','prepaid'].map(p => (
                  <label key={p} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color: payment===p ? '#2563EB' : '#374151' }}>
                    <input type="radio" name="payment" checked={payment===p} onChange={()=>setPayment(p)} style={{ accentColor:'#2563EB' }}/>
                    {p === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid'}
                  </label>
                ))}
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:4, paddingBottom:24 }}>
              <button style={{ padding:'11px 28px', borderRadius:12, border:'1.5px solid #E5E7EB', background:'#fff', fontSize:14, fontWeight:700, color:'#374151', cursor:'pointer' }}>
                Add Order
              </button>
              <button onClick={handleShip} style={{ padding:'11px 32px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#1E3A5F,#2563EB)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(37,99,235,0.35)' }}>
                Ship Now
              </button>
            </div>
          </div>

          {/* RIGHT — AI + ORDER SUMMARY */}
          <div style={{ position:'sticky', top:16 }}>
            {/* AI ASSIST */}
            <div style={{ background:'#fff', borderRadius:16, padding:'16px 18px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:'1px solid #F1F5F9', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ fontSize:11, fontWeight:800, color:'#7C3AED', letterSpacing:'0.06em' }}>✦ PRECISION ARCHITECT AI</span>
              </div>
              {AI_HINTS.map((h, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:10, padding:'10px 12px', borderRadius:10, background: h.type==='error'?'#FEF2F2': h.type==='warning'?'#FFFBEB':'#F0FDF4', border:`1px solid ${h.type==='error'?'#FECACA':h.type==='warning'?'#FDE68A':'#BBF7D0'}` }}>
                  <span style={{ fontSize:14, flexShrink:0, color: h.type==='error'?'#DC2626':h.type==='warning'?'#D97706':'#16A34A' }}>{h.icon}</span>
                  <span style={{ fontSize:11, color:'#374151', lineHeight:1.5 }}>{h.text}</span>
                </div>
              ))}
            </div>

            {/* ORDER SUMMARY */}
            <div style={{ background:'linear-gradient(135deg,#1E3A5F,#1E40AF)', borderRadius:16, padding:'18px 20px', color:'#fff', marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>Order Summary</div>
              {[
                { label:'Items Subtotal',    val:'₹1,299.00' },
                { label:'Shipping Charges',  val:'₹85.00'    },
                { label:'Taxes (GST)',        val:'₹233.82'   },
                { label:'COD Charges',        val:'₹0.00'     },
              ].map((r,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8, opacity:0.85 }}>
                  <span>{r.label}</span><span>{r.val}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:10, paddingTop:10 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', opacity:0.7, marginBottom:4 }}>TOTAL AMOUNT</div>
                <div style={{ fontSize:24, fontWeight:900 }}>₹1,617.82</div>
              </div>
            </div>

            {/* INSURED */}
            <div style={{ background:'#fff', borderRadius:14, padding:'12px 16px', border:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#374151', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div><div style={{ fontWeight:700, fontSize:12 }}>Insured Shipment</div><div style={{ fontSize:10, color:'#94A3B8' }}>Protected up to ₹10,000</div></div>
            </div>
          </div>
        </div>

      ) : (
        /* TABLE VIEW */
        <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #F1F5F9', overflow:'hidden' }}>
          <div style={{ padding:'16px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Submitted Orders</span>
            <span style={{ fontSize:12, color:'#94A3B8' }}>{allOrders.length} orders</span>
          </div>
          {allOrders.length === 0 ? (
            <div style={{ padding:'48px', textAlign:'center', color:'#94A3B8', fontSize:14 }}>No orders submitted yet.</div>
          ) : (
          <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['Order ID','Customer','Phone','Address','City','State','Pincode','Email','Product','Unit Price','Qty','Discount','Tax','HSN','Weight','Package','Payment','Status','Value','Date','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:'#64748B', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allOrders.map((o, i) => (
                <tr key={i} style={{ borderTop:'1px solid #F1F5F9' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'11px 12px', fontWeight:600, color:'#2563EB', whiteSpace:'nowrap' }}>{o.id}</td>
                  <td style={{ padding:'11px 12px', color:'#0F172A', fontWeight:500, whiteSpace:'nowrap' }}>{o.customer}</td>
                  <td style={{ padding:'11px 12px', color:'#64748B', whiteSpace:'nowrap' }}>{o.phone}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.address}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', whiteSpace:'nowrap' }}>{o.city}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', whiteSpace:'nowrap' }}>{o.state}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', whiteSpace:'nowrap' }}>{o.pincode}</td>
                  <td style={{ padding:'11px 12px', color:'#64748B', whiteSpace:'nowrap' }}>{o.email}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', whiteSpace:'nowrap' }}>{o.product}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', whiteSpace:'nowrap' }}>₹{o.unitPrice}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', textAlign:'center' }}>{o.qty}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', textAlign:'center' }}>{o.discount}%</td>
                  <td style={{ padding:'11px 12px', color:'#374151', textAlign:'center' }}>{o.tax}%</td>
                  <td style={{ padding:'11px 12px', color:'#64748B' }}>{o.hsn}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', whiteSpace:'nowrap' }}>{o.weight} kg</td>
                  <td style={{ padding:'11px 12px', color:'#374151', whiteSpace:'nowrap' }}>{o.packageType}</td>
                  <td style={{ padding:'11px 12px', color:'#374151', whiteSpace:'nowrap' }}>{o.payment}</td>
                  <td style={{ padding:'11px 12px' }}>
                    <span style={{ fontSize:10, fontWeight:700, color:STATUS_COLOR[o.status]||'#374151', background:STATUS_BG[o.status]||'#F3F4F6', padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{o.status}</span>
                  </td>
                  <td style={{ padding:'11px 12px', fontWeight:700, color:'#0F172A', whiteSpace:'nowrap' }}>{o.value}</td>
                  <td style={{ padding:'11px 12px', color:'#94A3B8', whiteSpace:'nowrap' }}>{o.date}</td>
                  <td style={{ padding:'11px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      {['View','Edit','Track'].map(a => (
                        <button key={a} style={{ padding:'3px 8px', borderRadius:6, border:'1.5px solid #E5E7EB', background:'#fff', fontSize:10, fontWeight:600, color:'#374151', cursor:'pointer' }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563EB';e.currentTarget.style.color='#2563EB';}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.color='#374151';}}
                        >{a}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          )}
        </div>
      )}

      {/* AUTO-SAVE INDICATOR */}
      {view === 'form' && (
        <div style={{ position:'fixed', bottom:20, left:240, background:'#0F172A', color:'#fff', borderRadius:20, padding:'8px 16px', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', display:'inline-block' }}/>
          Auto-saving order draft...
        </div>
      )}
    </div>
  );
}
