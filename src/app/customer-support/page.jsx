'use client';
import { useState, useEffect, useRef, useCallback } from 'react';


const API = process.env.NEXT_PUBLIC_API_BASE || '';

const colors = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#6366F1', '#EC4899', '#EF4444', '#10B981'];
const getColor = (name) => colors[(name || '').charCodeAt(0) % colors.length];
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const languages = ['Hindi', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Bengali', 'Urdu', 'Spanish', 'Arabic', 'French', 'German', 'English'];
const channels = ['WhatsApp', 'Website', 'Instagram', 'Facebook', 'Telegram', 'Email', 'SMS', 'Voice'];
const langCodes = { 'Hindi': 'hi', 'Tamil': 'ta', 'Telugu': 'te', 'Marathi': 'mr', 'Gujarati': 'gu', 'Spanish': 'es', 'Arabic': 'ar', 'French': 'fr', 'German': 'de' };

const Avatar = ({ name, size = 36, status }) => (
  <div style={{ position: 'relative', flexShrink: 0 }}>
    <div style={{ width: size, height: size, borderRadius: '50%', background: getColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color: '#fff' }}>{initials(name)}</div>
    {status && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: status === 'online' ? '#22C55E' : status === 'away' ? '#F59E0B' : '#EF4444', border: '2px solid #fff' }} />}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: color + '20', color }}>{label}</span>
);

const menuItems = [
  { icon: 'C', label: 'Live Conversations', id: 'live' },
  { icon: 'K', label: 'Knowledge Base', id: 'kb' },
];

export default function CustomerSupportPage() {
  const [activeMenu, setActiveMenu] = useState('live');
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState('AI Autopilot');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);
  const selectedConvRef = useRef(null);
  const intelLoadingRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/customer-support/conversations`);
      const data = await res.json();
      if (data.success) setConversations(data.data.conversations || []);
    } catch (e) { console.error('Fetch convos error:', e); }
    finally { setLoadingConvs(false); }
  }, []);

  const fetchIntelligence = useCallback(async (convId) => {
    if (!convId || intelLoadingRef.current) return;
    intelLoadingRef.current = true;
    try {
      const res = await fetch(`${API}/api/omnichannel/conversations/${convId}/intelligence`);
      if (res.ok) {
        const data = await res.json();
        if (data?.success) setIntelligence(data.data);
      }
    } catch (e) { console.error('Intel error:', e); }
    finally { intelLoadingRef.current = false; }
  }, []);

  const fetchMessages = useCallback(async (convId, isInitial) => {
    if (!convId) return;
    if (isInitial) setLoadingMsgs(true);
    try {
      const res = await fetch(`${API}/api/customer-support/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.success) {
        const newMsgs = data.data.messages || [];
        const oldMsgs = messagesRef.current;
        if (newMsgs.length !== oldMsgs.length || !newMsgs.every((m, i) => m.id === oldMsgs[i]?.id)) {
          setMessages(newMsgs);
          messagesRef.current = newMsgs;
        }
      }
    } catch (e) { console.error('Fetch msgs error:', e); }
    finally { if (isInitial) setLoadingMsgs(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (selectedConv && selectedConvRef.current?.conversation_id !== selectedConv.conversation_id) {
      selectedConvRef.current = selectedConv;
      fetchMessages(selectedConv.conversation_id, true);
      fetchIntelligence(selectedConv.conversation_id);
    }
  }, [selectedConv, fetchMessages, fetchIntelligence]);

  useEffect(() => {
    if (!selectedConv) return;
    const t = setInterval(() => fetchMessages(selectedConv.conversation_id, false), 8000);
    return () => clearInterval(t);
  }, [selectedConv, fetchMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);
    const text = newMessage;
    setNewMessage('');
    try {
      const res = await fetch(`${API}/api/omnichannel/conversations/${selectedConv.conversation_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sender_type: 'support', sender_name: 'Support Agent' }),
      });
      const data = await res.json();
      if (data.success) await fetchMessages(selectedConv.conversation_id);
    } catch (e) { console.error('Send error:', e); }
    finally { setSending(false); }
  };

  const filteredConvs = conversations.filter(c => {
    if (searchQuery && !(c.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) && !(c.last_message || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterLang && (c.preferred_language || '') !== filterLang) return false;
    if (filterPriority && (c.priority || '') !== filterPriority) return false;
    return true;
  });

  const formatTime = (d) => { if (!d) return ''; const dt = new Date(d); const now = new Date(); const diff = (now - dt) / 1000; if (diff < 60) return 'now'; if (diff < 3600) return `${Math.floor(diff / 60)}m`; if (diff < 86400) return `${Math.floor(diff / 3600)}h`; return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };

  const statusCounts = { active: conversations.filter(c => c.status === 'open' || c.status === 'in_progress').length, resolved: conversations.filter(c => c.status === 'resolved' || c.status === 'closed').length, total: conversations.length };

  const getLastMsgForList = (c) => {
    const last = c.last_message || '';
    return last.length > 60 ? last.slice(0, 60) + '...' : last;
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 64px)', background: '#F0F2F5', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'clip', position: 'relative', color: '#1A1A2E', flexShrink: 0 }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}
        .scroll::-webkit-scrollbar{width:4px}
        .scroll::-webkit-scrollbar-track{background:transparent}
        .scroll::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px}
        .scroll:hover::-webkit-scrollbar-thumb{background:#9CA3AF}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideIn{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>

      {/* LEFT SIDEBAR */}
      <div style={{ width: 64, flexShrink: 0, background: '#1A1A2E', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 2, zIndex: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8 }}>I</div>
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveMenu(item.id)}
            style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: activeMenu === item.id ? 'rgba(124,58,237,0.2)' : 'transparent', color: activeMenu === item.id ? '#A78BFA' : '#6B7280', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'all 0.15s', position: 'relative' }} title={item.label}>
            <span style={{ fontSize: 16 }}>{item.icon === 'C' ? '💬' : item.icon === 'D' ? '📊' : item.icon === 'A' ? '🤖' : item.icon === 'I' ? '📈' : item.icon === 'H' ? '👥' : item.icon === 'K' ? '📚' : item.icon === 'W' ? '⚡' : item.icon === 'J' ? '🗺️' : item.icon === 'G' ? '📉' : item.icon === 'L' ? '🌐' : item.icon === 'T' ? '👤' : item.icon === 'S' ? '⚙️' : '•'}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '8px 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { label: 'Active', count: statusCounts.active, color: '#22C55E' },
            { label: 'Total', count: statusCounts.total, color: '#7C3AED' },
            { label: 'Done', count: statusCounts.resolved, color: '#6B7280' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, width: '90%' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 10, color: '#9CA3AF', flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#E5E7EB' }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CUSTOMER LIST PANEL */}
      <div style={{ width: 320, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Conversations</h2>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={fetchConversations} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#7C3AED' }}>
                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polyline points='23 4 23 10 17 10'/><path d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10'/></svg>
              </button>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '2px 10px', borderRadius: 12 }}>{filteredConvs.length}</span>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search customers..." style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F9FAFB' }} />
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#9CA3AF' strokeWidth='2' style={{ position: 'absolute', left: 10, top: 10 }}><circle cx='11' cy='11' r='8' /><line x1='21' y1='21' x2='16.65' y2='16.65' /></svg>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            <select value={filterLang} onChange={e => setFilterLang(e.target.value)} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 10, background: '#fff', color: '#374151', outline: 'none' }}>
              <option value=''>All Languages</option>
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 10, background: '#fff', color: '#374151', outline: 'none' }}>
              <option value=''>All Priority</option>
              <option value='high'>High</option>
              <option value='medium'>Medium</option>
              <option value='low'>Low</option>
            </select>
          </div>
        </div>
        <div className='scroll' style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>Loading conversations...</div>
          ) : filteredConvs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>No conversations found</div>
          ) : filteredConvs.map(c => {
            const isSelected = selectedConv?.conversation_id === c.conversation_id;
            return (
            <div key={c.conversation_id} onClick={() => setSelectedConv(c)}
              style={{ padding: '12px 16px', borderBottom: '1px solid #F9FAFB', cursor: 'pointer', background: isSelected ? '#F5F3FF' : 'transparent', borderLeft: isSelected ? '3px solid #7C3AED' : '3px solid transparent', transition: 'all 0.1s', position: 'relative' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Avatar name={c.customer_name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{c.customer_name || 'Unknown'}</span>
                    <span style={{ fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{formatTime(c.updated_at)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {c.preferred_language && <Pill label={c.preferred_language} color={langCodes[c.preferred_language] ? '#7C3AED' : '#6B7280'} />}
                    {c.priority && <Pill label={c.priority} color={c.priority === 'high' ? '#EF4444' : c.priority === 'medium' ? '#F59E0B' : '#6B7280'} />}
                    <Pill label={c.status || 'open'} color={c.status === 'open' ? '#22C55E' : c.status === 'resolved' ? '#3B82F6' : '#6B7280'} />
                  </div>
                  <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{getLastMsgForList(c)}</span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CHAT WINDOW */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minWidth: 0, overflow: 'clip' }}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={selectedConv.customer_name} size={38} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{selectedConv.customer_name || 'Unknown'}</span>
                    {selectedConv.preferred_language && <Pill label={selectedConv.preferred_language} color='#7C3AED' />}
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{selectedConv.subject || 'No subject'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedConv.status === 'open' ? '#22C55E' : selectedConv.status === 'resolved' ? '#3B82F6' : '#9CA3AF' }} />
                    <span style={{ fontSize: 11, color: '#6B7280', textTransform: 'capitalize' }}>{selectedConv.status}</span>
                    <span style={{ color: '#D1D5DB' }}>|</span>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{selectedConv.message_count || 0} messages</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Translation Banner */}
            {selectedConv.preferred_language && selectedConv.preferred_language !== 'English' && (
              <div style={{ padding: '8px 20px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#92400E', flexShrink: 0 }}>
                <span style={{ fontWeight: 700 }}>Translation Active</span>
                <span>{selectedConv.preferred_language} → English</span>
                <span style={{ color: '#D1D5DB' }}>|</span>
                <span>Auto-detected: {langCodes[selectedConv.preferred_language] || 'en'}</span>
              </div>
            )}

            {/* Messages */}
            <div className='scroll' style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 40 }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 40 }}>No messages yet. Start the conversation.</div>
              ) : messages.map((msg, i) => {
                const isCustomer = msg.sender_type === 'customer';
                const isAi = msg.sender_type === 'bot' || msg.sender_name === 'AI Agent';
                return (
                <div key={msg.id || i} style={{ animation: 'slideIn 0.2s ease' }}>
                  {isCustomer ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Avatar name={selectedConv.customer_name} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{msg.sender_name || selectedConv.customer_name || 'Customer'}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatTime(msg.created_at)}</span>
                        </div>
                        <div style={{ background: '#F3F4F6', borderRadius: '4px 16px 16px 16px', padding: '10px 14px', border: '1px solid #E5E7EB' }}>
                          <p style={{ fontSize: 13, color: '#111827', lineHeight: 1.6, margin: 0 }}>{msg.message_original || msg.message}</p>
                        </div>
                        {msg.message && msg.message_original && msg.message !== msg.message_original && (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '6px 10px', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, color: '#92400E' }}>English: </span>
                              <span style={{ fontSize: 11, color: '#92400E', fontWeight: 500 }}>{msg.message}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: '80%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 }}>
                          {isAi && <Pill label='AI' color='#7C3AED' />}
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatTime(msg.created_at)}</span>
                        </div>
                        <div style={{ background: isAi ? '#F5F3FF' : 'linear-gradient(135deg,#2563EB,#1D4ED8)', borderRadius: '16px 4px 16px 16px', padding: '10px 14px', border: isAi ? '1px solid #DDD6FE' : 'none' }}>
                          <p style={{ fontSize: 13, color: isAi ? '#4C1D95' : '#fff', lineHeight: 1.6, margin: 0 }}>{msg.message_translated || msg.message}</p>
                        </div>
                        {msg.message && msg.message_translated && msg.message !== msg.message_translated && (
                          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '6px 10px', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 500 }}>{msg.message_translated}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 20px 16px', background: '#fff', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#F9FAFB', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '10px 12px' }}>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Type your response... (English)" rows={1} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: 13, color: '#374151', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, maxHeight: 80 }} />
                <button onClick={sendMessage} disabled={!newMessage.trim() || sending} style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer', opacity: !newMessage.trim() || sending ? 0.5 : 1, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><line x1='22' y1='2' x2='11' y2='13' /><polygon points='22 2 15 22 11 13 2 9 22 2' /></svg>
                  {sending ? '...' : 'Send'}
                </button>
              </div>
              {selectedConv.preferred_language && selectedConv.preferred_language !== 'English' && (
                <div style={{ marginTop: 6, padding: '0 4px' }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>Response will be translated to {selectedConv.preferred_language}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14, flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>💬</div>
            <span>Select a conversation to start</span>
          </div>
        )}
      </div>

      {/* RIGHT: AI AUTOPILOT PANEL */}
      {showRightPanel && selectedConv && (
        <div style={{ width: 360, flexShrink: 0, background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
            {['AI Autopilot', 'Insights', 'Profile'].map(tab => (
              <button key={tab} onClick={() => setActiveRightTab(tab)} style={{ flex: 1, padding: '10px 0', border: 'none', background: activeRightTab === tab ? '#F5F3FF' : 'transparent', fontSize: 11, fontWeight: 600, color: activeRightTab === tab ? '#7C3AED' : '#6B7280', cursor: 'pointer', borderBottom: activeRightTab === tab ? '2px solid #7C3AED' : '2px solid transparent' }}>{tab}</button>
            ))}
          </div>

          {activeRightTab === 'AI Autopilot' && (
          <div className='scroll' style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: '#F5F3FF', borderRadius: 12, border: '1px solid #DDD6FE' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6D28D9', flex: 1 }}>AI Autopilot</span>
              <span style={{ fontSize: 10, color: '#7C3AED', background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: 10 }}>{intelligence?.intelligence?.sentiment ? Math.round(intelligence.intelligence.sentiment.score * 100) + '%' : '--'}</span>
            </div>

            <Section title='LANGUAGE DETECTION'>
              <InfoRow label='Detected' value={selectedConv.preferred_language || 'en'} />
              <InfoRow label='Code' value={langCodes[selectedConv.preferred_language] || 'en'} />
            </Section>

            <Section title='INTENT ANALYSIS'>
              <InfoRow label='Primary Intent' value={intelligence?.intelligence?.intent || 'Analyzing...'} />
              <InfoRow label='Urgency' value={intelligence?.intelligence?.urgency?.label || '--'} color={intelligence?.intelligence?.urgency?.label === 'high' || intelligence?.intelligence?.urgency?.label === 'critical' ? '#EF4444' : '#F59E0B'} />
              <InfoRow label='Priority Score' value={intelligence?.intelligence?.priorityScore != null ? intelligence.intelligence.priorityScore + '/100' : '--'} />
            </Section>

            <Section title='CUSTOMER INSIGHT'>
              <InfoRow label='Emotion' value={intelligence?.intelligence?.sentiment?.label || '--'} />
              <InfoRow label='Churn Risk' value={intelligence?.intelligence?.churnProbability != null ? (intelligence.intelligence.churnProbability > 0.5 ? 'High' : 'Low') : '--'} color={intelligence?.intelligence?.churnProbability > 0.5 ? '#EF4444' : '#22C55E'} />
              <InfoRow label='Fraud Score' value={intelligence?.intelligence?.fraudRisk != null ? Math.round(intelligence.intelligence.fraudRisk * 100) + '%' : '--'} color={intelligence?.intelligence?.fraudRisk > 0.5 ? '#EF4444' : '#22C55E'} />
              <InfoRow label='Customer Value' value={intelligence?.intelligence?.customerValue || '--'} />
            </Section>

            <Section title='PREDICTED OUTCOME'>
              <InfoRow label='Escalation Risk' value={intelligence?.intelligence?.escalationRisk != null ? Math.round(intelligence.intelligence.escalationRisk * 100) + '%' : '--'} />
              <InfoRow label='Messages' value={selectedConv.message_count || messages.length} />
            </Section>

            <div style={{ marginTop: 12, padding: '14px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', marginBottom: 10 }}>AI AUTO ACTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Send Reply', desc: 'AI-generated response', auto: true },
                  { label: 'Create Ticket', desc: 'Escalate to support team', auto: false },
                  { label: 'Track Order', desc: 'Fetch order status', auto: false },
                ].map((action, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#fff', border: '1px solid #E5E7EB' }}>
                    <input type='checkbox' defaultChecked={action.auto} style={{ accentColor: '#7C3AED' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{action.label}</div>
                      <div style={{ fontSize: 10, color: '#6B7280' }}>{action.desc}</div>
                    </div>
                    <Pill label={action.auto ? 'Auto' : 'Suggest'} color={action.auto ? '#7C3AED' : '#F59E0B'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {activeRightTab === 'Insights' && (
          <div className='scroll' style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#166534', flex: 1 }}>Live Analytics</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Response Time', value: '1.2m', change: '-12%', up: true },
                { label: 'Resolution Rate', value: '94%', change: '+3%', up: true },
                { label: 'Avg CSAT', value: '4.5', change: '+0.2', up: true },
                { label: 'Active Chats', value: String(statusCounts.active), change: '-', up: true },
              ].map(kpi => (
                <div key={kpi.label} style={{ padding: '12px', background: '#fff', borderRadius: 10, border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>{kpi.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{kpi.value}</div>
                  <div style={{ fontSize: 10, color: kpi.up ? '#22C55E' : '#EF4444' }}>{kpi.change}</div>
                </div>
              ))}
            </div>
            <Section title='SENTIMENT TREND'>
              {['Positive', 'Neutral', 'Negative'].map((s, i) => {
                const pct = [58, 27, 15][i];
                const barColors = ['#22C55E', '#F59E0B', '#EF4444'];
                return (
                  <div key={s} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginBottom: 3 }}><span>{s}</span><span style={{ fontWeight: 600 }}>{pct}%</span></div>
                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: barColors[i], borderRadius: 3 }} /></div>
                  </div>
                );
              })}
            </Section>
            <Section title='TOP INTENTS'>
              {[
                { label: 'Order Tracking', count: 42, pct: 35 },
                { label: 'Return Request', count: 18, pct: 15 },
                { label: 'Delivery Issue', count: 15, pct: 12.5 },
                { label: 'Product Inquiry', count: 12, pct: 10 },
              ].map((intent, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: ['#7C3AED', '#3B82F6', '#F59E0B', '#14B8A6'][i], fontSize: 9, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 12, color: '#374151' }}>{intent.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{intent.count}</span>
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>{intent.pct}%</span>
                </div>
              ))}
            </Section>
          </div>
          )}

          {activeRightTab === 'Profile' && (
          <div className='scroll' style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F1F5F9', marginBottom: 12 }}>
              <Avatar name={selectedConv.customer_name} size={56} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 8 }}>{selectedConv.customer_name || 'Unknown'}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{selectedConv.subject || 'No subject'}</div>
            </div>
            <Section title='CONTACT'>
              <InfoRow label='Email' value={selectedConv.customer_email || 'N/A'} />
              <InfoRow label='Phone' value={selectedConv.customer_phone || 'N/A'} />
              <InfoRow label='Language' value={selectedConv.preferred_language || 'en'} />
            </Section>
            <Section title='CONVERSATION'>
              <InfoRow label='Status' value={selectedConv.status || 'open'} />
              <InfoRow label='Priority' value={selectedConv.priority || 'normal'} />
              <InfoRow label='Messages' value={String(selectedConv.message_count || messages.length)} />
              <InfoRow label='Created' value={selectedConv.created_at ? new Date(selectedConv.created_at).toLocaleDateString() : 'N/A'} />
            </Section>
            <Section title='TAGS'>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {[selectedConv.status || 'Active', selectedConv.priority || 'Normal', selectedConv.preferred_language || 'English'].map(tag => (
                  <span key={tag} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#F5F3FF', color: '#7C3AED' }}>{tag}</span>
                ))}
              </div>
            </Section>
          </div>
          )}
        </div>
      )}

      {/* KNOWLEDGE BASE OVERLAY */}
      {activeMenu === 'kb' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setActiveMenu('live')}>
          <div style={{ width: 480, height: '100%', background: '#fff', boxShadow: '-8px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>📚</span><h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Knowledge Base</h2></div>
              <button onClick={() => setActiveMenu('live')} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F3F4F6', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>&#10005;</button>
            </div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F1F5F9' }}>
              <input placeholder='Search knowledge base...' style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F9FAFB' }} />
            </div>
            <div className='scroll' style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {[
                { category: 'Shipping & Delivery', icon: '🚚', articles: 8 }, { category: 'Returns & Refunds', icon: '🔄', articles: 6 },
                { category: 'Product Information', icon: '📦', articles: 12 }, { category: 'Account & Billing', icon: '👤', articles: 5 },
                { category: 'Order Management', icon: '📋', articles: 9 }, { category: 'Technical Support', icon: '🔧', articles: 4 },
              ].map(cat => (
                <div key={cat.category} style={{ padding: '12px 14px', background: '#FAFAFA', borderRadius: 10, border: '1px solid #F1F5F9', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{cat.category}</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>{cat.articles} articles</div></div>
                  <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#9CA3AF' strokeWidth='2'><polyline points='9 18 15 12 9 6' /></svg>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: '14px', background: '#F5F3FF', borderRadius: 12, border: '1px solid #DDD6FE' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6D28D9', marginBottom: 6 }}>🤖 AI-Powered Search</div>
                <div style={{ fontSize: 11, color: '#7C3AED', lineHeight: 1.5 }}>Ask the AI to find relevant articles. Try: "What's your return policy?" or "How do I track an order?"</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 12, padding: '12px 14px', background: '#FAFAFA', borderRadius: 10, border: '1px solid #F1F5F9' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
      <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: color || '#111827' }}>{value}</span>
    </div>
  );
}
