'use client';
import {useState,useEffect} from 'react';
import {useRouter} from 'next/navigation';

const API_BASE=process.env.NEXT_PUBLIC_API_BASE||'https://api.giftgala.in';

/* ── Mini sparkline SVG ── */
const MiniChart=({color='#BFDBFE',points='0,40 20,35 40,38 60,28 80,30 100,20 120,22'})=>(
  <svg width='100%' height='36' viewBox='0 0 120 44' preserveAspectRatio='none' style={{display:'block'}}>
    <defs>
      <linearGradient id={`g${color.replace('#','')}`} x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stopColor={color} stopOpacity='0.3'/>
        <stop offset='100%' stopColor={color} stopOpacity='0'/>
      </linearGradient>
    </defs>
    <polyline fill='none' stroke={color} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' points={points}/>
    <polygon fill={`url(#g${color.replace('#','')})`} points={`0,44 ${points} 120,44`}/>
  </svg>
);

/* ── Avatar ── */
const Avatar=({name,size=40})=>{
  const initials=(name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const colors=['#3B82F6','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#6366F1'];
  const color=colors[(name||'').charCodeAt(0)%colors.length];
  return(
    <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.32,fontWeight:700,color:'#fff',flexShrink:0,letterSpacing:'0.02em'}}>
      {initials}
    </div>
  );
};

/* ── Priority Badge ── */
const PriorityBadge=({priority})=>{
  const cfg={
    high:{bg:'#FEE2E2',color:'#991B1B',label:'High'},
    urgent:{bg:'#FEE2E2',color:'#991B1B',label:'Urgent'},
    medium:{bg:'#FEF3C7',color:'#92400E',label:'Medium'},
    low:{bg:'#F3F4F6',color:'#374151',label:'Low'},
  };
  const c=cfg[priority?.toLowerCase()]||cfg.medium;
  return <span style={{background:c.bg,color:c.color,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}>{c.label}</span>;
};

/* ── Status Badge ── */
const StatusBadge=({status})=>{
  const cfg={
    open:{bg:'#DCFCE7',color:'#166534',label:'Open'},
    in_progress:{bg:'#DBEAFE',color:'#1D4ED8',label:'In Progress'},
    resolved:{bg:'#F0FDF4',color:'#15803D',label:'Resolved'},
    closed:{bg:'#F3F4F6',color:'#6B7280',label:'Closed'},
  };
  const c=cfg[status?.toLowerCase()]||cfg.open;
  return <span style={{background:c.bg,color:c.color,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>{c.label}</span>;
};

export default function CustomerSupportPage(){
  const [conversations,setConversations]=useState([]);
  const [stats,setStats]=useState({total:0,open:0,in_progress:0,sla_risk:0});
  const [loading,setLoading]=useState(true);
  const [statusFilter,setStatusFilter]=useState('all');
  const [currentPage,setCurrentPage]=useState(1);
  const [pagination,setPagination]=useState(null);
  const router=useRouter();

  const fetchConversations=async()=>{
    try{
      setLoading(true);
      const token=localStorage.getItem('token');
      const res=await fetch(`${API_BASE}/api/customer-support/conversations?status=${statusFilter!=='all'?statusFilter:''}&page=${currentPage}&limit=10`,{
        headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}
      });
      const data=await res.json();
      if(data.success){
        const convos=data.data.conversations||[];
        setConversations(convos);
        setPagination(data.data.pagination);
        const open=convos.filter(c=>c.status==='open').length;
        const in_progress=convos.filter(c=>c.status==='in_progress').length;
        const sla=convos.filter(c=>c.priority==='high'||c.priority==='urgent').length;
        setStats({total:data.data.pagination?.total||convos.length,open,in_progress,sla_risk:sla});
      }
    }catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  useEffect(()=>{fetchConversations();},[currentPage,statusFilter]);

  const formatDate=(d)=>{
    if(!d)return{date:'-',time:''};
    const dt=new Date(d);
    return{
      date:dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
      time:dt.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
    };
  };

  const getTier=(conv)=>{
    if(conv.priority==='urgent'||conv.priority==='high')return'Enterprise Tier';
    return'Standard Tier';
  };

  const card={background:'#fff',borderRadius:16,border:'1px solid #E5E7EB',boxShadow:'0 2px 16px rgba(0,0,0,0.04)',padding:'20px 24px'};

  return(
    <div style={{background:'#F6F8FB',fontFamily:'Inter,sans-serif',padding:'24px 28px'}}>

      {/* ── Metric Cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>

        {/* Total Inquiries */}
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#6B7280'}}>TOTAL INQUIRIES</div>
            <span style={{fontSize:11,fontWeight:700,color:'#16A34A',background:'#F0FDF4',padding:'2px 8px',borderRadius:20}}>+12%</span>
          </div>
          <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:4}}>
            <span style={{fontSize:32,fontWeight:700,color:'#111827',lineHeight:1}}>{stats.total.toLocaleString('en-IN')}</span>
            <span style={{fontSize:12,color:'#6B7280'}}>this month</span>
          </div>
          <MiniChart color='#93C5FD' points='0,36 20,30 40,32 60,22 80,26 100,16 120,18'/>
        </div>

        {/* Avg Response Time */}
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#6B7280'}}>AVG. RESPONSE TIME</div>
            <span style={{fontSize:11,fontWeight:700,color:'#16A34A',background:'#F0FDF4',padding:'2px 8px',borderRadius:20}}>-0.4m</span>
          </div>
          <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:4}}>
            <span style={{fontSize:32,fontWeight:700,color:'#111827',lineHeight:1}}>2.3m</span>
            <span style={{fontSize:12,color:'#6B7280'}}>per ticket</span>
          </div>
          <MiniChart color='#93C5FD' points='0,38 20,34 40,36 60,28 80,30 100,22 120,24'/>
        </div>

        {/* Sentiment Score */}
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#6B7280'}}>SENTIMENT SCORE</div>
            <span style={{fontSize:11,fontWeight:700,color:'#16A34A',background:'#F0FDF4',padding:'2px 8px',borderRadius:20}}>+0.2</span>
          </div>
          <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:4}}>
            <span style={{fontSize:32,fontWeight:700,color:'#111827',lineHeight:1}}>4.8/5.0</span>
            <span style={{fontSize:12,color:'#6B7280'}}>customer CSAT</span>
          </div>
          <MiniChart color='#93C5FD' points='0,32 20,28 40,30 60,20 80,22 100,14 120,16'/>
        </div>

        {/* SLA Risk — critical card */}
        <div style={{...card,background:'#FFF5F5',border:'1px solid #FCA5A5'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#6B7280'}}>SLA RISK ALERTS</div>
            <span style={{fontSize:11,fontWeight:700,color:'#DC2626',background:'#FEE2E2',padding:'2px 8px',borderRadius:20}}>CRITICAL</span>
          </div>
          <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:4}}>
            <span style={{fontSize:32,fontWeight:700,color:'#DC2626',lineHeight:1}}>{stats.sla_risk}</span>
            <span style={{fontSize:12,color:'#6B7280'}}>expiring soon</span>
          </div>
          <MiniChart color='#FCA5A5' points='0,30 20,26 40,32 60,24 80,28 100,20 120,24'/>
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <div style={{background:'#fff',borderRadius:16,border:'1px solid #E5E7EB',boxShadow:'0 2px 16px rgba(0,0,0,0.04)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 28px',borderBottom:'1px solid #F1F5F9'}}>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:'#111827'}}>Live Inquiry Stream</div>
            <div style={{fontSize:13,color:'#6B7280',marginTop:2}}>Prioritized by urgency and customer tier</div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:13,fontWeight:600,color:'#374151',cursor:'pointer'}}>
              <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'/></svg>
              Filter
            </button>
            <button style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,border:'none',background:'#1E3A5F',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 4px 12px rgba(30,58,95,0.3)'}}>
              <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>
              Export
            </button>
          </div>
        </div>

        {/* Column Headers */}
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1.6fr 0.9fr 0.9fr 0.9fr 0.7fr 0.8fr',padding:'10px 28px',borderBottom:'1px solid #F1F5F9',background:'#FAFAFA'}}>
          {['CUSTOMER','SUBJECT','TYPE','PRIORITY','STATUS','ACTIVITY','DATE'].map(h=>(
            <div key={h} style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#9CA3AF'}}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div className='custom-scrollbar' style={{overflowY:'auto',maxHeight:'calc(100vh - 400px)',minHeight:80}}>
          {loading?(
            <div style={{padding:'48px',textAlign:'center'}}>
              <div style={{width:36,height:36,border:'3px solid #2563EB',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/>
              <div style={{color:'#9CA3AF',fontSize:13}}>Loading conversations...</div>
            </div>
          ):conversations.length===0?(
            <div style={{padding:'48px',textAlign:'center',color:'#9CA3AF',fontSize:14}}>No conversations found.</div>
          ):conversations.map((conv,idx)=>{
            const dt=formatDate(conv.updated_at||conv.created_at);
            return(
              <div key={conv.id||idx}
                onClick={()=>router.push(`/customer-support/${conv.conversation_id}`)}
                style={{display:'grid',gridTemplateColumns:'1.4fr 1.6fr 0.9fr 0.9fr 0.9fr 0.7fr 0.8fr',padding:'18px 28px',borderBottom:idx<conversations.length-1?'1px solid #F1F5F9':'none',alignItems:'center',cursor:'pointer',transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                {/* Customer */}
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <Avatar name={conv.customer_name||'U'}/>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>{conv.customer_name||'Unknown'}</div>
                    <div style={{fontSize:11,color:'#9CA3AF',marginTop:2}}>{getTier(conv)}</div>
                  </div>
                </div>

                {/* Subject */}
                <div style={{paddingRight:12}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#111827',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{conv.subject||'General Inquiry'}</div>
                  <div style={{fontSize:12,color:'#9CA3AF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{conv.description||conv.last_message||'—'}</div>
                </div>

                {/* Type */}
                <div>
                  {conv.inquiry_type?(
                    <span style={{background:'#EFF6FF',color:'#2563EB',borderRadius:20,padding:'4px 10px',fontSize:11,fontWeight:600,whiteSpace:'nowrap',textTransform:'capitalize'}}>{conv.inquiry_type.replace('_',' ')}</span>
                  ):(
                    <span style={{color:'#D1D5DB',fontSize:12}}>—</span>
                  )}
                </div>

                {/* Priority */}
                <div><PriorityBadge priority={conv.priority||'medium'}/></div>

                {/* Status */}
                <div><StatusBadge status={conv.status}/></div>

                {/* Activity */}
                <div style={{display:'flex',alignItems:'center',gap:6,color:'#6B7280'}}>
                  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/></svg>
                  <span style={{fontSize:13,fontWeight:600,color:'#374151'}}>{conv.message_count||0}</span>
                </div>

                {/* Date */}
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#374151'}}>{dt.date}</div>
                  <div style={{fontSize:11,color:'#9CA3AF',marginTop:2}}>{dt.time}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination&&(
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 28px',borderTop:'1px solid #F1F5F9',flexShrink:0}}>
            <span style={{fontSize:12,color:'#6B7280'}}>
              Showing {pagination.total===0?0:((currentPage-1)*10)+1}–{Math.min(currentPage*10,pagination.total||0)} of {pagination.total||0} conversations
            </span>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage<=1} style={{width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:16,cursor:currentPage<=1?'not-allowed':'pointer',opacity:currentPage<=1?0.4:1,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
              {Array.from({length:Math.min(5,pagination.pages||1)},(_,i)=>{
                const start=Math.max(1,Math.min(currentPage-2,(pagination.pages||1)-4));
                const p=start+i;
                if(p<1||p>(pagination.pages||1))return null;
                return(
                  <button key={p} onClick={()=>setCurrentPage(p)} style={{width:32,height:32,borderRadius:8,border:currentPage===p?'none':'1.5px solid #E5E7EB',background:currentPage===p?'#2563EB':'#fff',color:currentPage===p?'#fff':'#374151',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{p}</button>
                );
              })}
              <button onClick={()=>setCurrentPage(p=>Math.min(pagination.pages||1,p+1))} disabled={currentPage>=(pagination.pages||1)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:16,cursor:currentPage>=(pagination.pages||1)?'not-allowed':'pointer',opacity:currentPage>=(pagination.pages||1)?0.4:1,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
