'use client';
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? '#F59E0B' : '#E5E7EB'} stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

function Avatar({ name, size = 40 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const colors = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#6366F1','#EC4899'];
  const bg = colors[(name||'').charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.35, fontWeight:700, color:'#fff', flexShrink:0 }}>
      {initials}
    </div>
  );
}

function SentimentBadge({ rating }) {
  if (rating >= 4) return <span style={{ fontSize:11, fontWeight:700, color:'#065F46', background:'#ECFDF5', padding:'3px 10px', borderRadius:20 }}>● Positive Sentiment</span>;
  if (rating === 3) return <span style={{ fontSize:11, fontWeight:700, color:'#92400E', background:'#FEF3C7', padding:'3px 10px', borderRadius:20 }}>● Neutral Sentiment</span>;
  return <span style={{ fontSize:11, fontWeight:700, color:'#DC2626', background:'#FEF2F2', padding:'3px 10px', borderRadius:20 }}>● Negative Sentiment</span>;
}

function ReviewCard({ review, onApprove, onReject, onDelete }) {
  const [showReply, setShowReply] = useState(false);
  const isCritical = review.rating <= 2;

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      border: isCritical ? '2px solid #FCA5A5' : '1px solid #F1F5F9',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
        <Avatar name={review.customer_name || review.reviewer_name || 'User'} />
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>{review.customer_name || review.reviewer_name || 'Anonymous'}</span>
            {review.verified && <span style={{ fontSize:10, fontWeight:700, color:'#16A34A', background:'#DCFCE7', padding:'2px 8px', borderRadius:20 }}>✓ VERIFIED BUYER</span>}
          </div>
          <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>
            {review.product_name && <span>{review.product_name} • </span>}
            {new Date(review.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
          </div>
          <div style={{ marginTop:4 }}><StarRating rating={review.rating} /></div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {review.status === 'pending' && (
            <span style={{ fontSize:10, fontWeight:700, color:'#92400E', background:'#FEF3C7', padding:'3px 10px', borderRadius:20 }}>PENDING</span>
          )}
          {review.status === 'approved' && (
            <span style={{ fontSize:10, fontWeight:700, color:'#065F46', background:'#ECFDF5', padding:'3px 10px', borderRadius:20 }}>APPROVED</span>
          )}
          {review.status === 'rejected' && (
            <span style={{ fontSize:10, fontWeight:700, color:'#DC2626', background:'#FEF2F2', padding:'3px 10px', borderRadius:20 }}>REJECTED</span>
          )}
        </div>
      </div>

      {/* Review text */}
      {review.title && <div style={{ fontSize:14, fontWeight:700, color: isCritical?'#DC2626':'#1E40AF', marginBottom:6 }}>{review.title}</div>}
      <p style={{ fontSize:13, color:'#374151', lineHeight:1.6, margin:'0 0 12px' }}>{review.review_text || review.comment || '—'}</p>

      {/* Tags */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        <SentimentBadge rating={review.rating} />
        {isCritical && <span style={{ fontSize:11, fontWeight:700, color:'#DC2626', background:'#FEF2F2', padding:'3px 10px', borderRadius:20, border:'1px solid #FCA5A5' }}>CRITICAL URGENCY</span>}
      </div>

      {/* AI Smart Reply preview */}
      {review.admin_reply && (
        <div style={{ background:'#F8FAFF', borderRadius:10, padding:'10px 14px', marginBottom:12, border:'1px solid #E0EAFF' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'#2563EB', letterSpacing:'0.06em', marginBottom:4 }}>AI SMART REPLY</div>
          <p style={{ fontSize:12, color:'#374151', margin:0, lineHeight:1.5, fontStyle:'italic' }}>"{review.admin_reply}"</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        {isCritical ? (
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:10, border:'none', background:'#DC2626', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            🔺 Escalate to Specialist
          </button>
        ) : (
          <button onClick={() => setShowReply(!showReply)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:10, border:'none', background:'#1E3A5F', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            ▶ Post Smart Reply
          </button>
        )}
        {review.status === 'pending' && (
          <>
            <button onClick={() => onApprove(review.id)} style={{ width:32, height:32, borderRadius:'50%', border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#16A34A', fontSize:16 }}>✓</button>
            <button onClick={() => onReject(review.id)} style={{ width:32, height:32, borderRadius:'50%', border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#DC2626', fontSize:16 }}>✕</button>
          </>
        )}
        <button onClick={() => onDelete(review.id)} style={{ width:32, height:32, borderRadius:'50%', border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontSize:14 }}>✎</button>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({});
  const [stats, setStats]         = useState({ avg: 0, total: 0, pending: 0 });

  useEffect(() => { fetchReviews(); }, [filter, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let q = `page=${page}`;
      if (filter !== 'all') q += `&status=${filter}`;
      const res = await fetch(`${API_BASE}/api/admin/reviews?${q}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        setPagination(data.pagination || {});
        // Compute stats
        const all = data.data;
        const avg = all.length ? (all.reduce((s,r) => s + (r.rating||0), 0) / all.length).toFixed(1) : 0;
        setStats({ avg, total: data.pagination?.total || all.length, pending: all.filter(r=>r.status==='pending').length });
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/admin/reviews/${id}/status`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchReviews();
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/reviews/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    fetchReviews();
  };

  const FILTERS = ['all','pending','approved','rejected'];

  return (
    <div style={{ background: '#F1F5F9', fontFamily: 'Inter, sans-serif', padding: '20px 24px' }}>

      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#0F172A', margin:0 }}>Review Management</h1>
          <p style={{ fontSize:13, color:'#64748B', margin:'4px 0 0' }}>Curate, analyze, and respond to platform-wide feedback with AI assistance.</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button style={{ padding:'9px 18px', borderRadius:10, border:'1.5px solid #E5E7EB', background:'#fff', fontSize:13, fontWeight:600, color:'#374151', cursor:'pointer' }}>
            Review Queue {stats.pending > 0 && `(${stats.pending})`}
          </button>
          <button style={{ padding:'9px 18px', borderRadius:10, border:'none', background:'#1E3A5F', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Campaign Settings
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', border:'1px solid #F1F5F9' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', marginBottom:8 }}>AVERAGE RATING</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:32, fontWeight:900, color:'#0F172A' }}>{stats.avg}</span>
            <StarRating rating={Math.round(stats.avg)} size={18} />
          </div>
        </div>
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', border:'1px solid #F1F5F9' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', marginBottom:8 }}>TOTAL REVIEWS</div>
          <div style={{ fontSize:32, fontWeight:900, color:'#0F172A' }}>{stats.total.toLocaleString()}</div>
          {stats.pending > 0 && <div style={{ fontSize:12, color:'#F59E0B', marginTop:4 }}>{stats.pending} pending moderation</div>}
        </div>
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', border:'1px solid #F1F5F9' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.08em', marginBottom:8 }}>SENTIMENT TREND</div>
          <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:40 }}>
            {[30,45,35,55,50,65,70].map((h,i) => (
              <div key={i} style={{ flex:1, height:`${h}%`, background: i>=4?'#10B981':'#D1FAE5', borderRadius:4 }}/>
            ))}
          </div>
          <div style={{ fontSize:11, color:'#10B981', fontWeight:600, marginTop:6 }}>92% Positive Sentiment</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4, background:'#fff', borderRadius:10, padding:4, border:'1px solid #F1F5F9' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{
              padding:'6px 16px', borderRadius:8, border:'none', fontSize:12, fontWeight:600, cursor:'pointer',
              background: filter===f ? '#1E3A5F' : 'transparent',
              color: filter===f ? '#fff' : '#64748B',
            }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
        <span style={{ marginLeft:'auto', fontSize:12, color:'#94A3B8' }}>
          {loading ? 'Loading...' : `Displaying ${reviews.length} of ${stats.total}`}
        </span>
      </div>

      {/* REVIEWS GRID */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'48px', color:'#94A3B8', fontSize:14 }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign:'center', padding:'64px', color:'#94A3B8' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⭐</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#374151' }}>No reviews found</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r}
              onApprove={id => updateStatus(id, 'approved')}
              onReject={id => updateStatus(id, 'rejected')}
              onDelete={deleteReview}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {pagination.pages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:20 }}>
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
            style={{ width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:'pointer',fontSize:14 }}>‹</button>
          {Array.from({length:Math.min(pagination.pages,5)},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} style={{
              width:32,height:32,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',
              background:page===p?'#1E3A5F':'#fff', color:page===p?'#fff':'#374151',
              border:page===p?'none':'1.5px solid #E5E7EB',
            }}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(pagination.pages,p+1))} disabled={page===pagination.pages}
            style={{ width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:'pointer',fontSize:14 }}>›</button>
        </div>
      )}
    </div>
  );
}
