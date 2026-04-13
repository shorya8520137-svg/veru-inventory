'use client';
import {useState,useEffect} from 'react';

const API_BASE=process.env.NEXT_PUBLIC_API_BASE||'https://api.giftgala.in';

const BarChart=({data})=>{
  const max=Math.max(...data);
  return(
    <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80,padding:'0 4px'}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1,background:i===data.length-1?'#1D4ED8':'#BFDBFE',borderRadius:'4px 4px 0 0',height:(v/max*100)+'%',transition:'height 0.3s'}}/>
      ))}
    </div>
  );
};

const StatusBadge=({isActive})=>{
  const cfg=isActive
    ?{bg:'#DCFCE7',color:'#166534',dot:'#22C55E',label:'ACTIVE'}
    :{bg:'#FEF3C7',color:'#92400E',dot:'#F59E0B',label:'SUSPENDED'};
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:5,background:cfg.bg,color:cfg.color,borderRadius:20,padding:'4px 10px',fontSize:11,fontWeight:700,letterSpacing:'0.05em'}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:cfg.dot,display:'inline-block'}}/>
      {cfg.label}
    </span>
  );
};

const Avatar=({name})=>{
  const initials=(name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const colors=['#3B82F6','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#EF4444'];
  const color=colors[(name||'').charCodeAt(0)%colors.length];
  return <div style={{width:40,height:40,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>{initials}</div>;
};

function formatActivity(dateStr){
  if(!dateStr)return{main:'-',sub:''};
  const d=new Date(dateStr);
  const now=new Date();
  const diff=Math.floor((now-d)/1000);
  if(diff<60)return{main:'Just now',sub:''};
  if(diff<3600)return{main:`${Math.floor(diff/60)}m ago`,sub:''};
  if(diff<86400)return{main:`${Math.floor(diff/3600)}h ago`,sub:''};
  if(diff<172800)return{main:'Yesterday',sub:d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})};
  return{main:d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}),sub:d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})};
}

/* ── Overlay backdrop ── */
function Overlay({onClose,children}){
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(2px)'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:20,boxShadow:'0 24px 60px rgba(0,0,0,0.18)',width:480,maxWidth:'90vw',padding:28,position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:16,background:'#F3F4F6',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',color:'#6B7280'}}>✕</button>
        {children}
      </div>
    </div>
  );
}

export default function WebsiteCustomersPage(){
  const [customers,setCustomers]=useState([]);
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  const [activeTab,setActiveTab]=useState('all');
  const [currentPage,setCurrentPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1);
  const [totalCustomers,setTotalCustomers]=useState(0);
  const [error,setError]=useState('');
  const [overlay,setOverlay]=useState(null); // 'chart' | 'insights' | null

  const fetchCustomers=async(tab,page)=>{
    try{
      setLoading(true);
      const token=localStorage.getItem('token');
      let statusParam='';
      if(tab==='active')statusParam='active';
      else if(tab==='suspended')statusParam='suspended';
      const url=`${API_BASE}/api/website-customers?page=${page}&limit=10${statusParam?`&status=${statusParam}`:''}`;
      const res=await fetch(url,{headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}});
      const data=await res.json();
      if(data.success){
        setCustomers(data.data||[]);
        setTotalPages(data.pagination?.totalPages||1);
        setTotalCustomers(data.pagination?.total||0);
      } else setError(data.message||'Failed to fetch');
    }catch(e){setError('Failed to fetch customers');}
    finally{setLoading(false);}
  };

  const fetchStats=async()=>{
    try{
      const token=localStorage.getItem('token');
      const res=await fetch(`${API_BASE}/api/website-customers/stats`,{headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}});
      const data=await res.json();
      if(data.success)setStats(data.data);
    }catch(e){console.error(e);}
  };

  useEffect(()=>{fetchStats();},[]);
  useEffect(()=>{fetchCustomers(activeTab,currentPage);},[activeTab,currentPage]);

  const card={background:'#fff',borderRadius:16,border:'1px solid #E5E7EB',boxShadow:'0 2px 20px rgba(0,0,0,0.04)',padding:'20px 24px'};
  const btn={border:'none',borderRadius:24,padding:'9px 20px',fontSize:13,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8};
  const iconBtn={background:'#fff',border:'1px solid #E5E7EB',borderRadius:12,width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',transition:'box-shadow 0.2s'};

  return(
    <div style={{background:'#F6F8FB',fontFamily:'Inter,sans-serif',padding:'20px 32px 0 32px',display:'flex',flexDirection:'column',position:'relative'}}>

      {/* Metric Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:16,flexShrink:0}}>
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:'#EFF6FF',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#2563EB' strokeWidth='2'><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:'#16A34A',background:'#F0FDF4',padding:'3px 8px',borderRadius:20}}>Verified</span>
          </div>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:4}}>Total Customers</div>
          <div style={{fontSize:26,fontWeight:700,color:'#111827',lineHeight:1}}>{(stats?.total_customers||0).toLocaleString('en-IN')}</div>
          <div style={{height:3,background:'#E5E7EB',borderRadius:2,marginTop:12}}><div style={{height:'100%',width:'72%',background:'#2563EB',borderRadius:2}}/></div>
        </div>
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:'#F0FDF4',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#22C55E' strokeWidth='2'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>
            </div>
            <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'#16A34A'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#22C55E',display:'inline-block'}}/>LIVE
            </span>
          </div>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:4}}>Active Customers</div>
          <div style={{fontSize:26,fontWeight:700,color:'#111827',lineHeight:1}}>{(stats?.active_customers||0).toLocaleString('en-IN')}</div>
          <div style={{fontSize:11,color:'#22C55E',fontWeight:600,marginTop:4}}>Currently active</div>
        </div>
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:'#EFF6FF',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#2563EB' strokeWidth='2'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><line x1='19' y1='8' x2='19' y2='14'/><line x1='22' y1='11' x2='16' y2='11'/></svg>
            </div>
            <span style={{fontSize:11,fontWeight:600,color:'#1D4ED8',background:'#DBEAFE',padding:'3px 8px',borderRadius:20}}>This Week</span>
          </div>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:4}}>New Signups (7d)</div>
          <div style={{fontSize:26,fontWeight:700,color:'#111827',lineHeight:1}}>{(stats?.week_signups||0).toLocaleString('en-IN')}</div>
          <div style={{fontSize:11,color:'#22C55E',fontWeight:600,marginTop:4}}>Today: {stats?.today_signups||0}</div>
        </div>
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:'#FFF7ED',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#F59E0B' strokeWidth='2'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:'#92400E',background:'#FEF3C7',padding:'3px 8px',borderRadius:20}}>Monitor</span>
          </div>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:4}}>Suspended</div>
          <div style={{fontSize:26,fontWeight:700,color:'#111827',lineHeight:1}}>{(stats?.suspended_customers||0).toLocaleString('en-IN')}</div>
          <div style={{display:'flex',gap:16,marginTop:8}}>
            <div><div style={{fontSize:10,color:'#9CA3AF',fontWeight:600}}>GOOGLE</div><div style={{fontSize:12,fontWeight:700,color:'#6B7280'}}>{stats?.google_signups||0}</div></div>
            <div><div style={{fontSize:10,color:'#9CA3AF',fontWeight:600}}>MONTH</div><div style={{fontSize:12,fontWeight:700,color:'#0EA5E9'}}>{stats?.month_signups||0}</div></div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div style={{...card,padding:0,display:'flex',flexDirection:'column',marginBottom:16}}>
        {/* Tabs + Actions */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 24px',borderBottom:'1px solid #F1F5F9',flexShrink:0}}>
          <div style={{display:'flex'}}>
            {[['all','All Customers'],['active','Active'],['suspended','Suspended']].map(([key,label])=>(
              <button key={key} onClick={()=>{setActiveTab(key);setCurrentPage(1);}} style={{padding:'13px 16px',border:'none',background:activeTab===key?'#EFF6FF':'none',fontSize:13,fontWeight:activeTab===key?600:400,color:activeTab===key?'#2563EB':'#6B7280',cursor:'pointer',borderBottom:activeTab===key?'2px solid #2563EB':'2px solid transparent',marginBottom:'-1px',borderRadius:activeTab===key?'8px 8px 0 0':0}}>{label}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {/* Chart icon button */}
            <button title='Growth Chart' onClick={()=>setOverlay('chart')} style={iconBtn}>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#2563EB' strokeWidth='2'><polyline points='22 12 18 12 15 21 9 3 6 12 2 12'/></svg>
            </button>
            {/* AI Insights icon button */}
            <button title='AI Insights' onClick={()=>setOverlay('insights')} style={iconBtn}>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#8B5CF6' strokeWidth='2'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/></svg>
            </button>
            <button style={{...btn,background:'#F9FAFB',color:'#374151',border:'1px solid #E5E7EB',padding:'7px 14px',borderRadius:10}}>
              <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1.8fr 1fr 1.2fr 1fr 80px',padding:'10px 24px',borderBottom:'1px solid #F1F5F9',flexShrink:0}}>
          {['CUSTOMER','CONTACT','STATUS','LAST LOGIN','JOINED','ACTIONS'].map(h=>(
            <div key={h} style={{fontSize:11,fontWeight:600,letterSpacing:'0.07em',color:'#9CA3AF'}}>{h}</div>
          ))}
        </div>

        {/* Scrollable body */}
        <div className='scrollbar-hide' style={{overflowY:'auto',maxHeight:'calc(100vh - 460px)',minHeight:100}}>
          {loading?(
            <div style={{padding:'40px',textAlign:'center',color:'#9CA3AF',fontSize:14}}>Loading customers...</div>
          ):error?(
            <div style={{padding:'40px',textAlign:'center',color:'#EF4444',fontSize:14}}>{error}</div>
          ):customers.length===0?(
            <div style={{padding:'40px',textAlign:'center',color:'#9CA3AF',fontSize:14}}>No customers found.</div>
          ):customers.map((c,idx)=>{
            const activity=formatActivity(c.last_login);
            return(
              <div key={c.id||idx} style={{display:'grid',gridTemplateColumns:'2fr 1.8fr 1fr 1.2fr 1fr 80px',padding:'14px 24px',borderBottom:idx<customers.length-1?'1px solid #F1F5F9':'none',alignItems:'center',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <Avatar name={c.name}/>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{c.name||'-'}</div>
                    <div style={{fontSize:11,color:'#9CA3AF',marginTop:1}}>{c.google_id?'Google Account':'Email Account'}</div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:13,color:'#374151',wordBreak:'break-all'}}>{c.email||'-'}</div>
                  <div style={{fontSize:12,color:'#9CA3AF',marginTop:2}}>{c.phone||'—'}</div>
                </div>
                <div><StatusBadge isActive={c.is_active===1||c.is_active===true}/></div>
                <div>
                  <div style={{fontSize:13,color:'#374151'}}>{activity.main}</div>
                  {activity.sub&&<div style={{fontSize:11,color:'#9CA3AF',marginTop:2}}>{activity.sub}</div>}
                </div>
                <div style={{fontSize:13,color:'#374151'}}>{c.created_at?new Date(c.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'-'}</div>
                <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                  <button title='Edit' style={{background:'none',border:'none',cursor:'pointer',padding:5,borderRadius:6,color:'#6B7280',opacity:0.7}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/></svg>
                  </button>
                  <button title='View' style={{background:'none',border:'none',cursor:'pointer',padding:5,borderRadius:6,color:'#6B7280',opacity:0.7}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></svg>
                  </button>
                  <button title='Flag' style={{background:'none',border:'none',cursor:'pointer',padding:5,borderRadius:6,color:'#EF4444',opacity:0.7}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination — always visible, never pushed out */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 24px',borderTop:'1px solid #F1F5F9',flexShrink:0,background:'#fff',borderRadius:'0 0 16px 16px'}}>
          <span style={{fontSize:12,fontWeight:500,color:'#6B7280'}}>
            Showing {totalCustomers===0?0:((currentPage-1)*10)+1}–{Math.min(currentPage*10,totalCustomers)} of {totalCustomers.toLocaleString('en-IN')} customers
          </span>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage<=1} style={{width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:currentPage<=1?'not-allowed':'pointer',opacity:currentPage<=1?0.4:1,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
            {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
              const start=Math.max(1,Math.min(currentPage-2,totalPages-4));
              const p=start+i;
              if(p<1||p>totalPages)return null;
              return(
                <button key={p} onClick={()=>setCurrentPage(p)} style={{width:32,height:32,borderRadius:8,border:currentPage===p?'none':'1.5px solid #E5E7EB',background:currentPage===p?'#2563EB':'#fff',color:currentPage===p?'#fff':'#374151',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{p}</button>
              );
            })}
            {totalPages>5&&currentPage<totalPages-2&&<span style={{color:'#9CA3AF',fontSize:13,padding:'0 4px'}}>…</span>}
            {totalPages>5&&currentPage<totalPages-2&&(
              <button onClick={()=>setCurrentPage(totalPages)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',color:'#374151',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{totalPages}</button>
            )}
            <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage>=totalPages} style={{width:32,height:32,borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',cursor:currentPage>=totalPages?'not-allowed':'pointer',opacity:currentPage>=totalPages?0.4:1,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
          </div>
        </div>
      </div>

      {/* ── Growth Chart Overlay ── */}
      {overlay==='chart'&&(
        <Overlay onClose={()=>setOverlay(null)}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#2563EB' strokeWidth='2'><polyline points='22 12 18 12 15 21 9 3 6 12 2 12'/></svg>
            <span style={{fontSize:17,fontWeight:700,color:'#111827'}}>Growth Trajectory</span>
            <span style={{fontSize:10,fontWeight:700,color:'#2563EB',background:'#DBEAFE',padding:'2px 8px',borderRadius:20}}>Predictive AI</span>
          </div>
          <div style={{marginBottom:8}}>
            <BarChart data={[4,5,4,6,5,7,6,8,7,10]}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
            <span style={{fontSize:12,color:'#6B7280'}}>Last 10 periods</span>
            <button style={{background:'none',border:'none',fontSize:12,fontWeight:600,color:'#2563EB',cursor:'pointer'}}>Download Report</button>
          </div>
        </Overlay>
      )}

      {/* ── AI Insights Overlay ── */}
      {overlay==='insights'&&(
        <Overlay onClose={()=>setOverlay(null)}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#8B5CF6' strokeWidth='2'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/></svg>
            <span style={{fontSize:17,fontWeight:700,color:'#111827'}}>AI Insights</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'#F9FAFB',borderRadius:12,padding:'14px 16px',border:'1px solid #E5E7EB'}}>
              <div style={{fontSize:13,fontWeight:700,color:'#111827',marginBottom:6}}>Engagement Spike</div>
              <div style={{fontSize:13,color:'#6B7280',lineHeight:1.6}}>Active customers show strong retention. Keep engagement campaigns running for best results.</div>
            </div>
            <div style={{background:'#FFF7ED',borderRadius:12,padding:'14px 16px',border:'1px solid #FED7AA'}}>
              <div style={{fontSize:13,fontWeight:700,color:'#92400E',marginBottom:6}}>Churn Warning</div>
              <div style={{fontSize:13,color:'#78350F',lineHeight:1.6}}>{stats?.suspended_customers||0} customers are currently <span style={{color:'#EF4444',fontWeight:700}}>suspended</span>. Immediate outreach suggested.</div>
            </div>
            <button style={{background:'#2563EB',color:'#fff',border:'none',borderRadius:12,padding:'12px',fontSize:13,fontWeight:600,cursor:'pointer',width:'100%',boxShadow:'0 4px 12px rgba(37,99,235,0.3)',marginTop:4}}>Generate Focus List</button>
          </div>
        </Overlay>
      )}

    </div>
  );
}
