'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

const COLORS = {
  hot: '#EF4444',
  warm: '#F59E0B',
  cold: '#3B82F6',
  low_priority: '#9CA3AF',
  positive: '#22C55E',
  neutral: '#6B7280',
  negative: '#EF4444',
  urgent: '#DC2626',
  confused: '#F59E0B',
  frustrated: '#EF4444',
};

function StatCard({ label, value, sub, color, icon, extra }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#9CA3AF', textTransform: 'uppercase' }}>{label}</span>
        {icon && <span style={{ color: color || '#6B7280' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || '#111827', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6B7280' }}>{sub}</div>}
      {extra && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{extra}</div>}
    </div>
  );
}

function LeadRow({ lead, onClick }) {
  const tierColors = { hot: '#EF4444', warm: '#F59E0B', cold: '#3B82F6', low_priority: '#9CA3AF' };
  const intentLabels = {
    product_inquiry: 'Product Inquiry', bulk_purchase: 'Bulk Purchase', pricing: 'Pricing',
    shipping: 'Shipping', refund: 'Refund', complaint: 'Complaint', technical_support: 'Technical Support',
    product_comparison: 'Comparison', order_tracking: 'Order Tracking', general_inquiry: 'General',
    business_partnership: 'Partnership', custom_order: 'Custom Order', urgent_purchase: 'Urgent Purchase',
  };

  return (
    <div onClick={() => onClick(lead.conversation_id)}
      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.2fr', padding: '14px 20px', borderBottom: '1px solid #F3F4F6', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{lead.customer_name || 'Unknown'}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{lead.customer_email || ''}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: tierColors[lead.lead_tier] || '#9CA3AF', display: 'inline-block' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{lead.lead_tier?.replace('_', ' ') || 'Cold'}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{lead.lead_score || 0}</div>
      <div style={{ fontSize: 12, color: '#6B7280' }}>{intentLabels[lead.intent] || lead.intent || '—'}</div>
      <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'capitalize' }}>{lead.sentiment || '—'}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: lead.recommendation_priority === 'high' ? '#DC2626' : lead.recommendation_priority === 'medium' ? '#F59E0B' : '#6B7280' }}>
        {lead.recommended_action || '—'}
      </div>
    </div>
  );
}

export default function LeadIntelligencePage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [aiSummary, setAiSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/lead-intelligence/dashboard`);
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchLeads = useCallback(async (page = 1) => {
    try {
      let url = `${API_BASE}/api/lead-intelligence/leads?page=${page}&limit=50`;
      if (filterTier) url += `&tier=${filterTier}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data.leads || []);
        setPagination(json.data.pagination || { page: 1, total: 0 });
      }
    } catch (e) { console.error(e); }
  }, [filterTier]);

  useEffect(() => {
    fetchDashboard();
    fetchLeads();
    setLoading(false);
  }, [fetchDashboard, fetchLeads]);

  const generateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/api/lead-intelligence/dashboard`);
      const json = await res.json();
      if (!json.success) return;
      const d = json.data;
      setAiSummary(
        `Today's Summary:\n` +
        `${d.hot_leads} Hot Leads.\n` +
        `${d.warm_leads} Warm Leads.\n` +
        `${d.cold_leads} Cold Leads.\n` +
        `Average Lead Score: ${d.average_lead_score}/100.\n` +
        `Estimated Revenue: ₹${(d.estimated_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}.\n` +
        `Conversion Rate: ${d.conversion_rate}%.\n` +
        `Top Intent: ${d.top_intents?.[0]?.intent || 'N/A'} (${d.top_intents?.[0]?.count || 0} conversations).\n` +
        `${d.lost_lead_risk} leads at risk of losing.\n` +
        `${d.hot_leads > 0 ? d.hot_leads + ' leads require immediate human attention.' : 'No hot leads requiring immediate action.'}`
      );
    } catch (e) { console.error(e); }
    setGeneratingSummary(false);
  };

  const handleLeadClick = (conversationId) => {
    router.push(`/customer-support/${conversationId}`);
  };

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F8FB', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading lead intelligence...</div>
    </div>
  );

  return (
    <div style={{ height: '100%', background: '#F6F8FB', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'auto' }}>
      <style>{`
        .lead-scrollbar::-webkit-scrollbar { display: none; }
        .lead-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Lead Intelligence</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>AI Sales Copilot — real-time lead analysis and recommendations</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontWeight: 600, color: '#374151', background: '#fff', outline: 'none' }}>
              <option value="">All Leads</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="low_priority">Low Priority</option>
            </select>
            <button onClick={generateSummary} disabled={generatingSummary}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(109,40,217,0.3)' }}>
              {generatingSummary ? 'Generating...' : 'AI Summary'}
            </button>
          </div>
        </div>

        {/* AI Summary Banner */}
        {aiSummary && (
          <div style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 14, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <SparkleIcon />
            <div style={{ fontSize: 13, color: '#4C1D95', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{aiSummary}</div>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Leads" value={stats?.total_leads || 0} color="#111827" />
          <StatCard label="Hot Leads" value={stats?.hot_leads || 0} sub={`${stats?.hot_leads > 0 ? Math.round((stats.hot_leads / stats.total_leads) * 100) : 0}% of total`} color={COLORS.hot} />
          <StatCard label="Warm Leads" value={stats?.warm_leads || 0} color={COLORS.warm} />
          <StatCard label="Cold Leads" value={stats?.cold_leads || 0} color={COLORS.cold} />
          <StatCard label="Avg Lead Score" value={stats?.average_lead_score || 0} extra="/100" color="#7C3AED" />
          <StatCard label="Est. Revenue" value={`₹${(stats?.estimated_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="#059669" />
          <StatCard label="Conversion Rate" value={`${stats?.conversion_rate || 0}%`} color={stats?.conversion_rate >= 50 ? '#22C55E' : '#F59E0B'} />
          <StatCard label="Lost Lead Risk" value={stats?.lost_lead_risk || 0} color={COLORS.negative} />
        </div>

        {/* Top Intents */}
        {stats?.top_intents?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {stats.top_intents.map((item, i) => (
              <span key={i} style={{ background: '#F3F4F6', color: '#374151', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.intent.replace(/_/g, ' ')}
                <span style={{ background: '#E5E7EB', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{item.count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Leads Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.2fr', padding: '12px 20px', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
            {['CUSTOMER', 'TIER', 'SCORE', 'INTENT', 'SENTIMENT', 'RECOMMENDATION'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF' }}>{h}</div>
            ))}
          </div>
          <div className="lead-scrollbar" style={{ maxHeight: 'calc(100vh - 500px)', minHeight: 200, overflowY: 'auto' }}>
            {leads.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No leads analyzed yet. Send a message to a customer to generate lead intelligence.</div>
            ) : leads.map((lead, i) => (
              <LeadRow key={lead.id || i} lead={lead} onClick={handleLeadClick} />
            ))}
          </div>
        </div>

        {/* Pagination */}
        {pagination.total > 50 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button onClick={() => fetchLeads(pagination.page - 1)} disabled={pagination.page <= 1}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.5 : 1 }}>
              Previous
            </button>
            <span style={{ padding: '8px 12px', fontSize: 13, color: '#6B7280' }}>Page {pagination.page} of {Math.ceil(pagination.total / 50)}</span>
            <button onClick={() => fetchLeads(pagination.page + 1)} disabled={pagination.page >= Math.ceil(pagination.total / 50)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: pagination.page >= Math.ceil(pagination.total / 50) ? 'not-allowed' : 'pointer', opacity: pagination.page >= Math.ceil(pagination.total / 50) ? 0.5 : 1 }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M18 16l-1.5-1.5M6 16l1.5-1.5M12 21v-3"/>
    </svg>
  );
}
