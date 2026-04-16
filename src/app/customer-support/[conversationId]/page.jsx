'use client';
import {useState,useEffect,useRef} from 'react';
import {useParams,useRouter} from 'next/navigation';

const API_BASE=process.env.NEXT_PUBLIC_API_BASE||'https://api.giftgala.in';

const Avatar=({name,size=36})=>{
  const initials=(name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const colors=['#3B82F6','#8B5CF6','#14B8A6','#F59E0B','#6366F1','#EC4899'];
  const color=colors[(name||'').charCodeAt(0)%colors.length];
  return <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.33,fontWeight:700,color:'#fff',flexShrink:0}}>{initials}</div>;
};

const ProgressBar=({value,color='#22C55E'})=>(
  <div style={{flex:1,height:6,background:'#E5E7EB',borderRadius:4,overflow:'hidden',margin:'0 12px'}}>
    <div style={{width:`${value}%`,height:'100%',background:color,borderRadius:4}}/>
  </div>
);

/* ── Disposition Modal ── */
function DispositionModal({onClose,onSubmit}){
  const [form,setForm]=useState({inquiry_type:'',description:'',resolution:'',highlighted:''});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(3px)'}}>
      <div style={{background:'#fff',borderRadius:20,width:520,maxWidth:'92vw',boxShadow:'0 24px 60px rgba(0,0,0,0.2)',overflow:'hidden'}}>
        <div style={{background:'linear-gradient(135deg,#1E3A5F,#2563EB)',padding:'20px 24px'}}>
          <div style={{fontSize:16,fontWeight:700,color:'#fff',marginBottom:4}}>Conversation Disposition</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.7)'}}>Fill in the details before closing this conversation</div>
        </div>
        <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>INQUIRY TYPE</label>
            <select value={form.inquiry_type} onChange={e=>set('inquiry_type',e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:13,color:'#374151',outline:'none',background:'#fff',cursor:'pointer'}}>
              <option value=''>Select inquiry type...</option>
              <option value='billing'>Billing Issue</option>
              <option value='technical'>Technical Support</option>
              <option value='product'>Product Inquiry</option>
              <option value='refund'>Refund Request</option>
              <option value='complaint'>Complaint</option>
              <option value='general'>General Inquiry</option>
            </select>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>DESCRIPTION</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder='Brief description of the issue...' rows={3} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:13,color:'#374151',outline:'none',resize:'none',fontFamily:'Inter,sans-serif',boxSizing:'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>RESOLUTION</label>
            <textarea value={form.resolution} onChange={e=>set('resolution',e.target.value)} placeholder='How was this resolved?' rows={3} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:13,color:'#374151',outline:'none',resize:'none',fontFamily:'Inter,sans-serif',boxSizing:'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:8}}>HIGHLIGHT</label>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {['Resolved Successfully','Escalated','Follow-up Required','Customer Satisfied','Refund Issued','Bug Reported'].map(tag=>(
                <button key={tag} onClick={()=>set('highlighted',form.highlighted===tag?'':tag)} style={{padding:'6px 14px',borderRadius:20,border:`1.5px solid ${form.highlighted===tag?'#2563EB':'#E5E7EB'}`,background:form.highlighted===tag?'#EFF6FF':'#fff',color:form.highlighted===tag?'#2563EB':'#6B7280',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>{tag}</button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
            <button onClick={onClose} style={{padding:'10px 20px',borderRadius:10,border:'1.5px solid #E5E7EB',background:'#fff',fontSize:13,fontWeight:600,color:'#6B7280',cursor:'pointer'}}>Cancel</button>
            <button onClick={()=>onSubmit(form)} style={{padding:'10px 24px',borderRadius:10,border:'none',background:'#2563EB',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 4px 12px rgba(37,99,235,0.3)'}}>Close Conversation</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage(){
  const params=useParams();
  const router=useRouter();
  const messagesEndRef=useRef(null);
  const [messages,setMessages]=useState([]);
  const [newMessage,setNewMessage]=useState('');
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [slaAlert,setSlaAlert]=useState(false);       // red alert after 1 min no reply
  const [slaSeconds,setSlaSeconds]=useState(0);       // countdown seconds
  const [showDisposition,setShowDisposition]=useState(false);
  const [showAIAgent,setShowAIAgent]=useState(false);
  const [aiPhase,setAiPhase]=useState('init');
  const [aiLanguage,setAiLanguage]=useState('');
  const [aiMessages,setAiMessages]=useState([]);
  const [aiInput,setAiInput]=useState('');
  const [aiLoading,setAiLoading]=useState(false);
  const aiEndRef=useRef(null);
  const lastSupportReplyRef=useRef(null);             // timestamp of last support message
  const slaTimerRef=useRef(null);
  const conversationId=params.conversationId;

  const scrollToBottom=()=>messagesEndRef.current?.scrollIntoView({behavior:'smooth'});
  useEffect(()=>{scrollToBottom();},[messages]);

  const fetchMessages=async()=>{
    try{
      const res=await fetch(`${API_BASE}/api/customer-support/conversations/${conversationId}/messages`,{headers:{'Content-Type':'application/json'}});
      const data=await res.json();
      if(data.success){
        const msgs=data.data.messages||[];
        setMessages(msgs);
        // Find last support reply time
        const lastSupport=msgs.filter(m=>m.sender_type==='support').slice(-1)[0];
        lastSupportReplyRef.current=lastSupport?new Date(lastSupport.created_at):null;
      }
    }catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  // SLA timer — check every second if support hasn't replied in 60s
  useEffect(()=>{
    slaTimerRef.current=setInterval(()=>{
      const lastSupport=lastSupportReplyRef.current;
      const now=new Date();
      // If no support reply ever, use page load time as baseline
      const baseline=lastSupport||new Date(now.getTime()-0);
      const elapsed=Math.floor((now-(lastSupport||now))/1000);
      setSlaSeconds(elapsed);
      setSlaAlert(elapsed>=60);
    },1000);
    return()=>clearInterval(slaTimerRef.current);
  },[]);

  const sendMessage=async()=>{
    if(!newMessage.trim()||sending)return;
    setSending(true);
    try{
      const res=await fetch(`${API_BASE}/api/customer-support/conversations/${conversationId}/messages`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:newMessage,sender_type:'support',sender_name:'Support Agent'})
      });
      const data=await res.json();
      if(data.success){
        setNewMessage('');
        lastSupportReplyRef.current=new Date(); // reset SLA timer
        setSlaAlert(false);
        setSlaSeconds(0);
        await fetchMessages();
      }
    }catch(e){console.error(e);}
    finally{setSending(false);}
  };

  const handleKey=(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}};
  const generateReply=()=>setNewMessage("Thank you for reaching out! I'm looking into this right away and will get back to you shortly.");

  const handleMarkResolved=()=>setShowDisposition(true);

  // ── AI Agent ──
  const callAIAgent=async(phase,language,userMsg)=>{
    setAiLoading(true);
    try{
      const res=await fetch('/api/ai-agent',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({phase,language,message:userMsg,conversationHistory:aiMessages.map(m=>({role:m.role,content:m.content}))})
      });
      const data=await res.json();
      return data.data;
    }catch(e){console.error(e);return null;}
    finally{setAiLoading(false);}
  };

  const openAIAgent=async()=>{
    setShowAIAgent(true);
    if(aiMessages.length===0){
      const resp=await callAIAgent('init','','');
      if(resp)setAiMessages([{role:'assistant',type:resp.type,data:resp}]);
    }
  };

  const handleLanguageSelect=async(lang)=>{
    setAiLanguage(lang);
    setShowAIAgent(true); // auto-open AI panel when language selected from main chat
    setAiMessages(prev=>[...prev,{role:'user',content:`Selected: ${lang==='en'?'English':lang==='hi'?'हिंदी':lang==='ta'?'தமிழ்':'తెలుగు'}`}]);
    setAiPhase('language_selected');
    // Phase 2: show invoking
    const invoking=await callAIAgent('language_selected',lang,'');
    if(invoking){
      setAiMessages(prev=>[...prev,{role:'assistant',type:'agent_invoking',data:invoking}]);
      // After 2s auto-trigger final greeting
      setTimeout(async()=>{
        setAiPhase('ready');
        const greeting=await callAIAgent('final',lang,'Hello, I need help');
        if(greeting){
          setAiMessages(prev=>[...prev,{role:'assistant',type:'final_response',data:greeting}]);
          // Post greeting into main chat too
          if(greeting.reply_local) await postToMainChat(greeting.reply_local);
        }
      },2000);
    }
  };

  const sendAIMessage=async()=>{
    if(!aiInput.trim()||aiLoading)return;
    const msg=aiInput.trim();
    setAiInput('');
    setAiMessages(prev=>[...prev,{role:'user',content:msg}]);
    const resp=await callAIAgent('final',aiLanguage,msg);
    if(resp){
      setAiMessages(prev=>[...prev,{role:'assistant',type:resp.type||'final_response',data:resp}]);
      // Also post AI reply into main chat so customer sees it
      if(resp.type==='final_response'&&resp.reply_local){
        await postToMainChat(resp.reply_local);
      }
    }
  };

  // Post a message into the main chat window (customer sees it)
  const postToMainChat=async(text)=>{
    try{
      const res=await fetch(`${API_BASE}/api/customer-support/conversations/${conversationId}/messages`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:`🤖 ${text}`,sender_type:'support',sender_name:'AI Agent'})
      });
      const data=await res.json();
      if(data.success)await fetchMessages();
    }catch(e){console.error(e);}
  };

  useEffect(()=>{aiEndRef.current?.scrollIntoView({behavior:'smooth'});},[aiMessages]);

  const handleDispositionSubmit=async(form)=>{
    try{
      const token=localStorage.getItem('token');
      await fetch(`${API_BASE}/api/customer-support/conversations/${conversationId}/status`,{
        method:'PATCH',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({status:'resolved',...form})
      });
    }catch(e){console.error(e);}
    setShowDisposition(false);
    router.back();
  };

  useEffect(()=>{
    fetchMessages();
    const t=setInterval(fetchMessages,5000);
    return()=>clearInterval(t);
  },[conversationId]);

  const formatTime=(d)=>{if(!d)return'';return new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});};

  const formatDateLabel=(d)=>{
    if(!d)return'';
    const dt=new Date(d);const today=new Date();const yesterday=new Date(today);yesterday.setDate(today.getDate()-1);
    if(dt.toDateString()===today.toDateString())return'TODAY';
    if(dt.toDateString()===yesterday.toDateString())return'YESTERDAY';
    return dt.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}).toUpperCase();
  };

  const groupedMessages=messages.reduce((acc,msg)=>{
    const label=formatDateLabel(msg.created_at);
    if(!acc.length||acc[acc.length-1].label!==label)acc.push({label,msgs:[]});
    acc[acc.length-1].msgs.push(msg);
    return acc;
  },[]);

  const customerName=messages.find(m=>m.sender_type==='customer')?.sender_name||'Customer';
  const shortId=conversationId?.slice(0,12)||'INC-0000';

  const fmtSla=(s)=>{const m=Math.floor(s/60);const sec=s%60;return`${m}:${sec.toString().padStart(2,'0')}`;};

  if(loading)return(
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F6F8FB',fontFamily:'Inter,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:36,height:36,border:'3px solid #2563EB',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/>
        <div style={{color:'#9CA3AF',fontSize:13}}>Loading conversation...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return(
    <div style={{display:'flex',width:'100%',height:'calc(100vh - 57px)',background:'#F6F8FB',fontFamily:'Inter,sans-serif',overflow:'hidden',boxSizing:'border-box',position:'relative'}}>

      {showDisposition&&<DispositionModal onClose={()=>setShowDisposition(false)} onSubmit={handleDispositionSubmit}/>}

      {/* ══ LEFT: Chat Panel ══ */}
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'#fff',borderRight:'1px solid #E5E7EB',minWidth:0,overflow:'hidden'}}>

        {/* SLA Alert Banner */}
        {slaAlert&&(
          <div style={{background:'#FEF2F2',borderBottom:'2px solid #EF4444',padding:'10px 20px',display:'flex',alignItems:'center',gap:10,flexShrink:0,animation:'pulse 1.5s ease-in-out infinite'}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:'#EF4444',display:'inline-block',flexShrink:0}}/>
            <span style={{fontSize:13,fontWeight:700,color:'#DC2626'}}>⚠ SLA BREACH — No support reply for {fmtSla(slaSeconds)}. Respond immediately!</span>
            <span style={{marginLeft:'auto',fontSize:12,color:'#EF4444',fontWeight:600,background:'#FEE2E2',padding:'3px 10px',borderRadius:20}}>CRITICAL</span>
          </div>
        )}

        {/* Top Bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderBottom:'1px solid #E5E7EB',flexShrink:0,background: slaAlert?'#FFF5F5':'#fff',minHeight:52,transition:'background 0.3s'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>router.back()} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 6px 4px 0',color:'#6B7280',display:'flex',alignItems:'center',flexShrink:0}}>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polyline points='15 18 9 12 15 6'/></svg>
            </button>
            <span style={{width:8,height:8,borderRadius:'50%',background:slaAlert?'#EF4444':'#22C55E',display:'inline-block',flexShrink:0}}/>
            <span style={{fontSize:13,fontWeight:600,color:slaAlert?'#DC2626':'#111827',whiteSpace:'nowrap'}}>
              {slaAlert?'⚠ Response Overdue':'Active Conversation'}
            </span>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
            <button style={{background:'none',border:'none',fontSize:13,fontWeight:600,color:'#2563EB',cursor:'pointer',padding:'7px 10px',borderRadius:8,whiteSpace:'nowrap'}}>Assign to Me</button>
            <button onClick={()=>setShowDisposition(true)} style={{background:'#EF4444',color:'#fff',border:'none',borderRadius:10,padding:'7px 16px',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>End Chat</button>
            <button onClick={handleMarkResolved} style={{background:'#1E3A5F',color:'#fff',border:'none',borderRadius:10,padding:'7px 16px',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>Mark Resolved</button>
          </div>
        </div>

        {/* Messages */}
        <div className='custom-scrollbar' style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:0}}>
          {messages.length===0?(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#9CA3AF',fontSize:14}}>No messages yet.</div>
          ):groupedMessages.map((group,gi)=>(
            <div key={gi}>
              <div style={{display:'flex',alignItems:'center',gap:12,margin:'16px 0'}}>
                <div style={{flex:1,height:1,background:'#F1F5F9'}}/>
                <span style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',color:'#9CA3AF'}}>{group.label}</span>
                <div style={{flex:1,height:1,background:'#F1F5F9'}}/>
              </div>
              {group.msgs.map((msg,mi)=>{
                const isSupport=msg.sender_type==='support';
                const isBot=msg.sender_type==='bot';
                return(
                  <div key={msg.id||mi} style={{marginBottom:16}}>
                    {isBot?(
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                          <span style={{fontSize:12,color:'#2563EB',fontWeight:600}}>Support Bot (Auto-ACK)</span>
                          <span style={{fontSize:11,color:'#9CA3AF'}}>{formatTime(msg.created_at)}</span>
                        </div>
                        <div style={{position:'relative',maxWidth:'72%'}}>
                          <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:16,padding:'14px 18px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                            <p style={{fontSize:13,color:'#374151',lineHeight:1.6,margin:0}}>{msg.message}</p>
                          </div>
                          <div style={{position:'absolute',right:-14,top:12,width:28,height:28,borderRadius:'50%',background:'#EFF6FF',border:'1px solid #DBEAFE',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#2563EB' strokeWidth='2'><circle cx='12' cy='12' r='10'/><path d='M12 8v4l3 3'/></svg>
                          </div>
                        </div>
                        {/* Language buttons after every bot message */}
                        <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
                          {[{label:'🇬🇧 English',value:'en'},{label:'🇮🇳 हिंदी',value:'hi'},{label:'🇮🇳 தமிழ்',value:'ta'},{label:'🇮🇳 తెలుగు',value:'te'}].map(lang=>(
                            <button key={lang.value} onClick={()=>handleLanguageSelect(lang.value)} style={{padding:'8px 16px',borderRadius:20,border:`1.5px solid ${aiLanguage===lang.value?'#22C55E':'#7C3AED'}`,background:aiLanguage===lang.value?'#22C55E':'#fff',color:aiLanguage===lang.value?'#fff':'#7C3AED',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ):isSupport?(
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:12,color:'#6B7280',fontWeight:500}}>{msg.sender_name||'Support Agent'}</span>
                          <span style={{fontSize:11,color:'#9CA3AF'}}>{formatTime(msg.created_at)}</span>
                        </div>
                        <div style={{maxWidth:'72%',background:'linear-gradient(135deg,#2563EB,#1D4ED8)',borderRadius:16,padding:'14px 18px',boxShadow:'0 4px 12px rgba(37,99,235,0.25)'}}>
                          <p style={{fontSize:13,color:'#fff',lineHeight:1.6,margin:0}}>{msg.message}</p>
                        </div>
                      </div>
                    ):(
                      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                        <Avatar name={msg.sender_name||customerName} size={36}/>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                            <span style={{fontSize:13,fontWeight:700,color:'#111827'}}>{msg.sender_name||customerName}</span>
                            <span style={{fontSize:11,color:'#9CA3AF'}}>{formatTime(msg.created_at)}</span>
                          </div>
                          <div style={{maxWidth:'72%',background:'#F3F4F6',borderRadius:16,padding:'14px 18px'}}>
                            <p style={{fontSize:13,color:'#111827',lineHeight:1.6,margin:0}}>{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef}/>
        </div>

        {/* AI Shortcuts */}
        <div style={{padding:'10px 20px 8px',borderTop:'1px solid #F1F5F9',display:'flex',gap:8,flexShrink:0,background:'#fff',flexWrap:'wrap'}}>
          <button onClick={generateReply} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,border:'1.5px solid #DBEAFE',background:'#EFF6FF',color:'#2563EB',fontSize:12,fontWeight:600,cursor:'pointer'}}>
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>
            Generate Reply
          </button>
          <button style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',color:'#374151',fontSize:12,fontWeight:600,cursor:'pointer'}}>
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M12 20h9'/><path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'/></svg>
            Improve Tone
          </button>
          <button style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,border:'1.5px solid #E5E7EB',background:'#fff',color:'#374151',fontSize:12,fontWeight:600,cursor:'pointer'}}>
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/></svg>
            Summarize
          </button>
          <button onClick={openAIAgent} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,border:'1.5px solid #8B5CF6',background:'linear-gradient(135deg,#7C3AED,#6D28D9)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',marginLeft:'auto',boxShadow:'0 4px 12px rgba(109,40,217,0.3)'}}>
            <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><circle cx='12' cy='12' r='10'/><path d='M12 8v4l3 3'/></svg>
            AI Agent
          </button>
        </div>

        {/* Input */}
        <div style={{padding:'10px 20px 16px',background:'#fff',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'flex-end',gap:12,background:slaAlert?'#FFF5F5':'#F9FAFB',borderRadius:14,border:`1.5px solid ${slaAlert?'#FCA5A5':'#E5E7EB'}`,padding:'12px 16px',transition:'all 0.3s'}}>
            <textarea value={newMessage} onChange={e=>setNewMessage(e.target.value)} onKeyDown={handleKey} placeholder={slaAlert?"⚠ Customer waiting — type your response now...":"Type your response or use '/' for macros..."} rows={2} disabled={sending} style={{flex:1,background:'none',border:'none',outline:'none',resize:'none',fontSize:13,color:'#374151',fontFamily:'Inter,sans-serif',lineHeight:1.6}}/>
            <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
              <button style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4,display:'flex',alignItems:'center'}}>
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'/></svg>
              </button>
              <button onClick={sendMessage} disabled={!newMessage.trim()||sending} style={{background:slaAlert?'#DC2626':'#1E3A5F',color:'#fff',border:'none',borderRadius:10,padding:'9px 20px',fontSize:13,fontWeight:600,cursor:!newMessage.trim()||sending?'not-allowed':'pointer',opacity:!newMessage.trim()||sending?0.5:1,whiteSpace:'nowrap',transition:'background 0.3s'}}>
                {sending?'Sending...':'Send Response'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ RIGHT: AI Insights Panel ══ */}
      <div className='custom-scrollbar' style={{width:320,flexShrink:0,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:14,background:'#F6F8FB'}}>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E5E7EB',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#9CA3AF'}}>AI CONTEXT</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,color:'#16A34A',background:'#F0FDF4',padding:'3px 10px',borderRadius:20}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#22C55E',display:'inline-block'}}/>Positive Sentiment
            </span>
          </div>
          <div style={{background:'#EFF6FF',borderRadius:12,padding:'14px 16px'}}>
            <p style={{fontSize:13,color:'#1E40AF',lineHeight:1.7,margin:0}}>Customer is reporting a support inquiry. Conversation is active. Monitor for escalation signals and respond promptly.</p>
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E5E7EB',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#9CA3AF',marginBottom:16}}>INTELLIGENCE INDICATORS</div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'flex',alignItems:'center'}}>
              <span style={{fontSize:13,color:'#374151',width:130,flexShrink:0}}>Churn Probability</span>
              <ProgressBar value={12} color='#22C55E'/>
              <span style={{fontSize:13,fontWeight:700,color:'#374151',width:36,textAlign:'right'}}>12%</span>
            </div>
            <div style={{display:'flex',alignItems:'center'}}>
              <span style={{fontSize:13,color:'#374151',width:130,flexShrink:0}}>Escalation Risk</span>
              <ProgressBar value={slaAlert?90:65} color={slaAlert?'#EF4444':'#F59E0B'}/>
              <span style={{fontSize:13,fontWeight:700,color:slaAlert?'#DC2626':'#374151',width:36,textAlign:'right'}}>{slaAlert?'90%':'65%'}</span>
            </div>
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E5E7EB',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#9CA3AF',marginBottom:14}}>SMART SUGGESTIONS</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[{icon:'#DBEAFE',stroke:'#2563EB',title:'Knowledge Base',sub:'Manually syncing CRM records...',path:'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'},{icon:'#FEF3C7',stroke:'#D97706',title:'Use Macro',sub:'EMEA Node Maintenance Update',path:'M13 2 3 14h9l-1 8 10-12h-9l1-8z'}].map(s=>(
              <div key={s.title} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px',borderRadius:10,background:'#F9FAFB',border:'1px solid #F1F5F9',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='#EFF6FF'} onMouseLeave={e=>e.currentTarget.style.background='#F9FAFB'}>
                <div style={{width:32,height:32,borderRadius:8,background:s.icon,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke={s.stroke} strokeWidth='2'><path d={s.path}/></svg>
                </div>
                <div><div style={{fontSize:13,fontWeight:600,color:'#111827',marginBottom:2}}>{s.title}</div><div style={{fontSize:12,color:'#9CA3AF'}}>{s.sub}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E5E7EB',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#9CA3AF',marginBottom:16}}>SYSTEM METADATA</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div><div style={{fontSize:10,fontWeight:700,letterSpacing:'0.07em',color:'#9CA3AF',marginBottom:4}}>ID</div><div style={{fontSize:12,fontWeight:700,color:'#111827',fontFamily:'monospace',wordBreak:'break-all'}}>{shortId}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,letterSpacing:'0.07em',color:'#9CA3AF',marginBottom:4}}>CATEGORY</div><div style={{fontSize:13,fontWeight:700,color:'#111827'}}>Support</div></div>
            <div><div style={{fontSize:10,fontWeight:700,letterSpacing:'0.07em',color:'#9CA3AF',marginBottom:4}}>PRIORITY</div><div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:13,fontWeight:700,color:'#DC2626'}}><span style={{width:7,height:7,borderRadius:'50%',background:'#EF4444',display:'inline-block'}}/>Critical</div></div>
            <div><div style={{fontSize:10,fontWeight:700,letterSpacing:'0.07em',color:'#9CA3AF',marginBottom:4}}>WAIT TIME</div><div style={{fontSize:13,fontWeight:700,color:slaAlert?'#DC2626':'#111827'}}>{fmtSla(slaSeconds)}</div></div>
          </div>
        </div>
      </div>

      {/* ══ AI Agent Panel (slide-in overlay) ══ */}
      {showAIAgent&&(
        <div style={{position:'absolute',top:0,right:0,width:380,height:'100%',background:'#fff',borderLeft:'1px solid #E5E7EB',boxShadow:'-8px 0 32px rgba(0,0,0,0.12)',display:'flex',flexDirection:'column',zIndex:100}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #E5E7EB',background:'linear-gradient(135deg,#7C3AED,#6D28D9)',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth='2'><circle cx='12' cy='12' r='10'/><path d='M12 8v4l3 3'/></svg>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>AI Support Agent</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>Responses auto-post to main chat</div>
              </div>
            </div>
            <button onClick={()=>setShowAIAgent(false)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',color:'#fff',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>

          {/* Messages */}
          <div className='custom-scrollbar' style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
            {aiMessages.map((msg,i)=>{
              if(msg.role==='user'){
                return(
                  <div key={i} style={{display:'flex',justifyContent:'flex-end'}}>
                    <div style={{background:'linear-gradient(135deg,#7C3AED,#6D28D9)',color:'#fff',borderRadius:'16px 16px 4px 16px',padding:'10px 14px',maxWidth:'80%',fontSize:13,lineHeight:1.5}}>{msg.content}</div>
                  </div>
                );
              }
              const d=msg.data;
              if(!d)return null;

              if(d.type==='language_selection'){
                return(
                  <div key={i} style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{background:'#F9FAFB',borderRadius:'4px 16px 16px 16px',padding:'12px 14px',fontSize:13,color:'#111827',lineHeight:1.6,border:'1px solid #E5E7EB'}}>{d.message}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {d.options?.map(opt=>(
                        <button key={opt.value} onClick={()=>handleLanguageSelect(opt.value)} disabled={aiPhase!=='init'} style={{padding:'10px 16px',borderRadius:10,border:'1.5px solid #7C3AED',background:aiLanguage===opt.value?'#7C3AED':'#fff',color:aiLanguage===opt.value?'#fff':'#7C3AED',fontSize:13,fontWeight:600,cursor:aiPhase!=='init'?'default':'pointer',transition:'all 0.15s',opacity:aiPhase!=='init'&&aiLanguage!==opt.value?0.4:1}}>{opt.label}</button>
                      ))}
                    </div>
                  </div>
                );
              }

              if(d.type==='agent_invoking'){
                return(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,background:'#F5F3FF',borderRadius:12,padding:'12px 14px',border:'1px solid #DDD6FE'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'#7C3AED',animation:'invoking 1s ease-in-out infinite',flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:'#6D28D9',marginBottom:2}}>{d.agent?.replace('_',' ').toUpperCase()}</div>
                      <div style={{fontSize:12,color:'#7C3AED'}}>{d.message}</div>
                    </div>
                    <div style={{marginLeft:'auto',width:20,height:20,border:'2px solid #7C3AED',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',flexShrink:0}}/>
                  </div>
                );
              }

              if(d.type==='final_response'){
                return(
                  <div key={i} style={{display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{background:'#F9FAFB',borderRadius:'4px 16px 16px 16px',padding:'12px 14px',fontSize:13,color:'#111827',lineHeight:1.6,border:'1px solid #E5E7EB'}}>{d.reply_local}</div>
                    {d.reply_local!==d.reply_en&&<div style={{background:'#EFF6FF',borderRadius:10,padding:'8px 12px',fontSize:11,color:'#2563EB',lineHeight:1.5,border:'1px solid #DBEAFE'}}><span style={{fontWeight:700}}>EN: </span>{d.reply_en}</div>}
                    <button onClick={()=>postToMainChat(d.reply_local)} style={{alignSelf:'flex-start',background:'none',border:'1px solid #7C3AED',borderRadius:8,padding:'4px 12px',fontSize:11,fontWeight:600,color:'#7C3AED',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:5}}>
                      <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><line x1='22' y1='2' x2='11' y2='13'/><polygon points='22 2 15 22 11 13 2 9 22 2'/></svg>
                      Send to Chat
                    </button>
                  </div>
                );
              }
              return null;
            })}
            {aiLoading&&(
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#F5F3FF',borderRadius:12,border:'1px solid #DDD6FE'}}>
                <div style={{display:'flex',gap:4}}>
                  {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#7C3AED',animation:`invoking 1s ease-in-out ${i*0.2}s infinite`}}/>)}
                </div>
                <span style={{fontSize:12,color:'#7C3AED'}}>AI is thinking...</span>
              </div>
            )}
            <div ref={aiEndRef}/>
          </div>

          {/* Input */}
          {aiPhase==='ready'&&(
            <div style={{padding:'12px 16px',borderTop:'1px solid #E5E7EB',flexShrink:0,background:'#fff'}}>
              <div style={{display:'flex',gap:8,alignItems:'flex-end',background:'#F9FAFB',borderRadius:12,border:'1.5px solid #E5E7EB',padding:'10px 12px'}}>
                <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAIMessage();}}} placeholder='Ask the AI agent...' rows={2} style={{flex:1,background:'none',border:'none',outline:'none',resize:'none',fontSize:13,color:'#374151',fontFamily:'Inter,sans-serif',lineHeight:1.5}}/>
                <button onClick={sendAIMessage} disabled={!aiInput.trim()||aiLoading} style={{background:'#7C3AED',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:!aiInput.trim()||aiLoading?'not-allowed':'pointer',opacity:!aiInput.trim()||aiLoading?0.5:1,whiteSpace:'nowrap',flexShrink:0}}>Send</button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
        @keyframes invoking{0%{opacity:0.4}50%{opacity:1}100%{opacity:0.4}}
      `}</style>
    </div>
  );
}
