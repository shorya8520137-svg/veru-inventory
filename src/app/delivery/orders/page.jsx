'use client';
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

const STATUS_COLOR = { Delivered:'#16A34A', 'In Transit':'#2563EB', Pending:'#F59E0B', RTO:'#DC2626', Cancelled:'#6B7280' };
const STATUS_BG    = { Delivered:'#DCFCE7', 'In Transit':'#DBEAFE', Pending:'#FEF3C7', RTO:'#FEE2E2', Cancelled:'#F3F4F6' };

const COLS = [
  { key:'id',          label:'Order ID'    },
  { key:'customer',    label:'Customer'    },
  { key:'phone',       label:'Phone'       },
  { key:'address',     label:'Address'     },
  { key:'city',        label:'City'        },
  { key:'state',       label:'State'       },
  { key:'pincode',     label:'Pincode'     },
  { key:'email',       label:'Email'       },
  { key:'product',     label:'Product'     },
  { key:'unitPrice',   label:'Unit Price'  },
  { key:'qty',         label:'Qty'         },
  { key:'discount',    label:'Discount'    },
  { key:'tax',         label:'Tax'         },
  { key:'hsn',         label:'HSN'         },
  { key:'weight',      label:'Weight'      },
  { key:'packageType', label:'Package'     },
  { key:'payment',     label:'Payment'     },
  { key:'status',      label:'Status'      },
  { key:'value',       label:'Value'       },
  { key:'date',        label:'Date'        },
];

export default function OrdersPage() {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/dispatch?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success || Array.isArray(d.data)) setOrders(d.data?.dispatches || d.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search || Object.values(o).some(v => String(v).toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ background:'#F1F5F9', fontFamily:'Inter,sans-serif', padding:'16px 24px' }}>

      {/* SEARCH + FILTER only */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:16 }}>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft:30, paddingRight:12, paddingTop:8, paddingBottom:8, borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:13, outline:'none', background:'#fff', width:220 }}
            />
          </div>
          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding:'8px 12px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:13, background:'#fff', outline:'none', cursor:'pointer' }}>
            {['All','Pending','In Transit','Delivered','RTO','Cancelled'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

      {/* TABLE */}
      <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #F1F5F9', overflow:'hidden' }}>
        <div style={{ padding:'14px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>All Orders</span>
          <span style={{ fontSize:12, color:'#94A3B8' }}>{filtered.length} records</span>
        </div>

        {loading ? (
          <div style={{ padding:'48px', textAlign:'center', color:'#94A3B8', fontSize:14 }}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'64px', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#374151', marginBottom:6 }}>No orders yet</div>
            <div style={{ fontSize:13, color:'#94A3B8' }}>Orders submitted from "Create Order" will appear here.</div>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {COLS.map(c => (
                    <th key={c.key} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#64748B', whiteSpace:'nowrap', borderBottom:'1px solid #F1F5F9' }}>{c.label}</th>
                  ))}
                  <th style={{ padding:'10px 14px', fontSize:10, fontWeight:700, color:'#64748B' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={i} style={{ borderTop:'1px solid #F1F5F9', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding:'11px 14px', fontWeight:600, color:'#2563EB', whiteSpace:'nowrap' }}>{o.order_id}</td>
                    <td style={{ padding:'11px 14px', fontWeight:500, color:'#0F172A', whiteSpace:'nowrap' }}>{o.customer_name}</td>
                    <td style={{ padding:'11px 14px', color:'#64748B', whiteSpace:'nowrap' }}>{o.customer_phone}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.customer_address}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', whiteSpace:'nowrap' }}>{o.customer_city}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', whiteSpace:'nowrap' }}>{o.customer_state}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', whiteSpace:'nowrap' }}>{o.customer_pincode}</td>
                    <td style={{ padding:'11px 14px', color:'#64748B', whiteSpace:'nowrap' }}>{o.customer_email}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', whiteSpace:'nowrap' }}>{o.product_name}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', whiteSpace:'nowrap' }}>₹{o.unit_price}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', textAlign:'center' }}>{o.quantity}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', textAlign:'center' }}>{o.discount}%</td>
                    <td style={{ padding:'11px 14px', color:'#374151', textAlign:'center' }}>{o.tax}%</td>
                    <td style={{ padding:'11px 14px', color:'#64748B' }}>{o.hsn_code}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', whiteSpace:'nowrap' }}>{o.dead_weight} kg</td>
                    <td style={{ padding:'11px 14px', color:'#374151', whiteSpace:'nowrap' }}>{o.package_type}</td>
                    <td style={{ padding:'11px 14px', color:'#374151', whiteSpace:'nowrap' }}>{o.payment_method}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:10, fontWeight:700, color:STATUS_COLOR[o.status]||'#374151', background:STATUS_BG[o.status]||'#F3F4F6', padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{o.status}</span>
                    </td>
                    <td style={{ padding:'11px 14px', fontWeight:700, color:'#0F172A', whiteSpace:'nowrap' }}>₹{o.order_value}</td>
                    <td style={{ padding:'11px 14px', color:'#94A3B8', whiteSpace:'nowrap' }}>{new Date(o.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td style={{ padding:'11px 14px' }}>
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
    </div>
  );
}
