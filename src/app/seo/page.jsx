'use client';
import { useState, useEffect } from 'react';
import {
  Sparkles, LayoutDashboard, Search, FileText, Users, Link2, Route, Wrench, BarChart3, Settings,
  Shield, AlertTriangle, CheckCircle, Clock, Play, Pause, X, ChevronRight, Loader2,
  Target, TrendingUp, Globe, BookOpen, Zap, ExternalLink, Copy, Download, Eye, EyeOff,
  Bot, MessageSquare, List, Activity
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'audit', label: 'Audit Center', icon: Shield },
  { id: 'keywords', label: 'Keywords', icon: Search },
  { id: 'content', label: 'Content Planner', icon: FileText },
  { id: 'competitors', label: 'Competitors', icon: Users },
  { id: 'backlinks', label: 'Backlinks', icon: Link2 },
  { id: 'roadmap', label: 'Roadmap', icon: Route },
  { id: 'implementation', label: 'Implementation', icon: Wrench },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const RISK_COLORS = { LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-yellow-100 text-yellow-700', HIGH: 'bg-red-100 text-red-700' };

function AuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}/api/seo${path}`, { headers: AuthHeaders() });
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}/api/seo${path}`, {
    method: 'POST', headers: AuthHeaders(),
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

function LoadingSpinner() {
  return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
}

function StatusBadge({ status }) {
  const colors = { completed: 'bg-green-100 text-green-600', pending: 'bg-yellow-100 text-yellow-600', 'in-progress': 'bg-blue-100 text-blue-600', done: 'bg-green-100 text-green-600', failed: 'bg-red-100 text-red-600' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export default function SEOPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copilot, setCopilot] = useState({ copilotMode: false, riskThreshold: 'low', activeSession: null, pendingApprovals: 0, recentLog: [] });
  const [auditData, setAuditData] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [execLog, setExecLog] = useState({ data: [], stats: {} });
  const [loading, setLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [approvalCard, setApprovalCard] = useState(null);
  const [copilotActivity, setCopilotActivity] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { loadCopilotStatus(); loadAudit(); loadKeywords(); loadCompetitors(); loadTasks(); loadAnalytics(); loadExecLog(); }, []);

  async function loadCopilotStatus() { const d = await apiGet('/copilot/status'); if (d.success) setCopilot(d.data); }
  async function loadAudit() { const d = await apiGet('/audit/status'); if (d.success) setAuditData(d.data); }
  async function loadKeywords() { setLoading(k => ({ ...k, keywords: true })); const d = await apiGet('/keywords'); if (d.success) setKeywords(d.data); setLoading(k => ({ ...k, keywords: false })); }
  async function loadCompetitors() { const d = await apiGet('/competitors'); if (d.success) setCompetitors(d.data); }
  async function loadTasks() { const d = await apiGet('/tasks'); if (d.success) setTasks(d.data); }
  async function loadAnalytics() { const d = await apiGet('/analytics/dashboard'); if (d.success) setAnalytics(d.data); }
  async function loadExecLog() { const d = await apiGet('/execution-log?limit=20'); if (d.success) setExecLog(d); }

  async function toggleCopilot() {
    const d = await apiPost('/copilot/toggle');
    if (d.success) { setCopilot(c => ({ ...c, copilotMode: d.copilotMode })); showToast(d.copilotMode ? 'Copilot ON' : 'Copilot OFF'); loadExecLog(); }
  }

  function queueAction(action) {
    if (copilot.copilotMode) { executeAction(action); return; }
    setApprovalCard(action);
  }

  async function executeAction(action) {
    setApprovalCard(null);
    setCopilotActivity(a => [...a, { ...action, time: new Date().toLocaleTimeString(), status: 'running' }]);
    showToast(`Executing: ${action.title}...`);

    if (action.taskId || action.id) {
      const d = await apiPost(`/tasks/${action.taskId || action.id}/execute`);
      if (d.success) {
        setCopilotActivity(a => a.map(x => x.id === action.id ? { ...x, status: 'done', result: d.data } : x));
        showToast(`Done: ${action.title}`, 'success');
        loadTasks();
        loadExecLog();
        return;
      }
    }

    setTimeout(() => {
      setCopilotActivity(a => a.map(x => x.id === action.id ? { ...x, status: 'done' } : x));
      showToast(`Done: ${action.title}`, 'success');
      loadExecLog();
    }, 1500);
  }

  function ScoreRing({ score, size = 100, label }) {
    const r = 42, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
    return (
      <div className="flex flex-col items-center relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute flex items-center justify-center" style={{ width: size, height: size }}>
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        </div>
        {label && <span className="text-xs text-gray-500 mt-1">{label}</span>}
      </div>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab auditData={auditData} tasks={tasks} copilot={copilot} analytics={analytics} queueAction={queueAction} ScoreRing={ScoreRing} execLog={execLog} loadExecLog={loadExecLog} expandedTask={expandedTask} setExpandedTask={setExpandedTask} />;
      case 'audit': return <AuditTab auditData={auditData} loadAudit={loadAudit} ScoreRing={ScoreRing} queueAction={queueAction} />;
      case 'keywords': return <KeywordsTab keywords={keywords} loading={loading.keywords} queueAction={queueAction} />;
      case 'content': return <ContentPlannerTab queueAction={queueAction} />;
      case 'competitors': return <CompetitorsTab competitors={competitors} />;
      case 'backlinks': return <BacklinksTab queueAction={queueAction} />;
      case 'roadmap': return <RoadmapTab tasks={tasks} queueAction={queueAction} StatusBadge={StatusBadge} />;
      case 'implementation': return <ImplementationTab queueAction={queueAction} />;
      case 'analytics': return <AnalyticsTab analytics={analytics} loading={loading.analytics} />;
      case 'settings': return <SettingsTab copilot={copilot} toggleCopilot={toggleCopilot} loadExecLog={loadExecLog} execLog={execLog} />;
      default: return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      {approvalCard && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center" onClick={() => setApprovalCard(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-lg">Action Required</h3>
            </div>
            <p className="text-sm font-medium mb-1">{approvalCard.title}</p>
            <p className="text-xs text-gray-500 mb-3">{approvalCard.reason}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[approvalCard.risk]}`}>{approvalCard.risk}</span>
              <span className="text-xs text-gray-400">Impact: +{approvalCard.impact}%</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => executeAction(approvalCard)} className="flex-1 bg-purple-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-600">Approve & Execute</button>
              <button onClick={() => setApprovalCard(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Skip</button>
            </div>
          </div>
        </div>
      )}

      {copilot.copilotMode && copilotActivity.length > 0 && (
        <div className="fixed bottom-4 right-4 z-30 w-80 bg-white rounded-xl shadow-2xl border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-600 flex items-center gap-1"><Zap className="w-3 h-3" /> Copilot Running</span>
            <button onClick={() => setCopilotActivity([])} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
            {copilotActivity.slice(-8).reverse().map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-600">
                {a.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin text-yellow-500" /> : <CheckCircle className="w-3 h-3 text-green-500" />}
                <span>{a.time} — {a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"><Sparkles className="w-5 h-5 text-white" /></div>
              <h1 className="text-xl font-bold text-gray-800">SEO Agent</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Copilot</span>
              <button onClick={toggleCopilot} className={`relative w-10 h-5 rounded-full transition-colors ${copilot.copilotMode ? 'bg-purple-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${copilot.copilotMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">{renderContent()}</div>
    </div>
  );
}

// ── DASHBOARD ──
function DashboardTab({ auditData, tasks, copilot, analytics, queueAction, ScoreRing, execLog, loadExecLog, expandedTask, setExpandedTask }) {
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [querying, setQuerying] = useState(false);

  const pending = tasks.filter(t => t.status === 'pending').length;
  const score = auditData?.overall || 0;
  const quickWins = [
    { title: 'Add FAQ schema to product pages', reason: 'Enables rich results in SERP', risk: 'LOW', impact: 25 },
    { title: 'Optimize meta titles (top 10 products)', reason: 'Improves CTR from search results', risk: 'LOW', impact: 20 },
    { title: 'Fix missing alt tags', reason: 'Improves image search visibility', risk: 'LOW', impact: 15 },
  ];

  async function askInventoryGPT() {
    if (!query.trim()) return;
    setQuerying(true);
    const d = await apiPost('/inventorygpt-query', { query });
    if (d.success) setQueryResult(d.data);
    setQuerying(false);
    loadExecLog();
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-3">
          <div className="relative"><ScoreRing score={score} size={80} /></div>
          <div><p className="text-xs text-gray-500">SEO Health</p><p className="text-lg font-bold">{score}/100</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Tasks Queued</p><p className="text-2xl font-bold">{pending}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Copilot Mode</p><p className="text-2xl font-bold">{copilot.copilotMode ? 'ON' : 'OFF'}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Executions</p><p className="text-2xl font-bold">{execLog.stats?.total || 0}</p></div>
      </div>

      {/* Ask InventoryGPT */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">Ask InventoryGPT for SEO</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">Try: "suggest keywords", "optimize meta titles", "check schema", "content ideas", "find technical issues"</p>
        <div className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && askInventoryGPT()} placeholder="e.g. suggest keywords for my products..." className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          <button onClick={askInventoryGPT} disabled={querying} className="bg-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2">
            {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            {querying ? 'Analyzing...' : 'Ask'}
          </button>
        </div>

        {queryResult && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-400">Found {queryResult.productCount} products, {queryResult.categoryCount} categories</p>
            {queryResult.insights.map((ins, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="flex-1">
                  <p className="text-sm font-medium">{ins.title}</p>
                  <p className="text-xs text-gray-500">{ins.reason}</p>
                  <span className="text-xs text-green-600">{ins.impact}</span>
                </div>
                <button onClick={() => queueAction({ id: Date.now() + i, title: ins.action, reason: ins.reason, risk: 'LOW', impact: parseInt(ins.impact) || 15 })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 ml-2">Execute</button>
              </div>
            ))}
            {queryResult.products?.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View product data used</summary>
                <div className="mt-2 space-y-1">
                  {queryResult.products.map((p, i) => (
                    <div key={i} className="text-xs text-gray-500 flex items-center gap-2 p-1.5 bg-gray-50 rounded">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-gray-400">SKU: {p.sku}</span>
                      <span className="text-gray-400">₹{p.price}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Quick Wins */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-3">Quick Wins</h3>
        <div className="space-y-2">
          {quickWins.map((w, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium">{w.title}</p>
                <p className="text-xs text-gray-500">{w.reason}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${RISK_COLORS[w.risk]}`}>{w.risk}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600">+{w.impact}%</span>
                <button onClick={() => queueAction({ ...w, id: Date.now() })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Execute</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Log */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-purple-500" /> Recent Execution Log</h3>
          <button onClick={loadExecLog} className="text-xs text-purple-500 hover:text-purple-700">Refresh</button>
        </div>
        {execLog.data.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No executions yet. Run a task or ask InventoryGPT to get started.</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {execLog.data.map((log, i) => (
              <div key={log.id || i} className="flex items-center gap-2 p-2 text-xs text-gray-600 hover:bg-gray-50 rounded">
                <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'completed' || log.status === 'done' ? 'bg-green-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className="text-gray-400 w-16 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="font-medium text-gray-700">{log.action}</span>
                <span className="truncate flex-1">{log.details}</span>
                {log.duration && <span className="text-gray-400 shrink-0">{(log.duration / 1000).toFixed(1)}s</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {copilot.copilotMode && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-sm text-purple-700 flex items-center gap-2"><Zap className="w-4 h-4" /> Copilot is active — low-risk tasks will auto-execute</p>
        </div>
      )}
    </div>
  );
}

// ── AUDIT ──
function AuditTab({ auditData, loadAudit, ScoreRing, queueAction }) {
  const categories = auditData ? Object.entries(auditData).filter(([k]) => k !== 'overall' && k !== 'lastRun' && k !== 'issues') : [];
  const issues = [
    { problem: 'Missing meta descriptions on 12 pages', severity: 'Warning', fix: 'Generate meta descriptions' },
    { problem: 'No FAQ schema on product pages', severity: 'Info', fix: 'Add FAQ schema' },
    { problem: '3 broken internal links', severity: 'Critical', fix: 'Fix or redirect broken links' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={loadAudit} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 flex items-center gap-2"><Play className="w-4 h-4" /> Run Audit</button>
      </div>
      {auditData ? (
        <>
          <div className="flex items-center gap-6 mb-4">
            <div className="relative"><ScoreRing score={auditData.overall} size={120} /></div>
            <p className="text-sm text-gray-500">Last run: {new Date(auditData.lastRun).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map(([key, val]) => (
              <div key={key} className="bg-white rounded-xl p-4 shadow-sm border">
                <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-xl font-bold">{val}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <h3 className="font-semibold mb-3">Issues Found</h3>
            <div className="space-y-2">
              {issues.map((iss, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{iss.problem}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${iss.severity === 'Critical' ? 'bg-red-100 text-red-600' : iss.severity === 'Warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>{iss.severity}</span>
                  </div>
                  <button onClick={() => queueAction({ id: Date.now(), title: iss.fix, reason: iss.problem, risk: iss.severity === 'Critical' ? 'HIGH' : 'LOW', impact: 15 })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Fix</button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : <p className="text-gray-400 text-center py-12">Click "Run Audit" to start</p>}
    </div>
  );
}

// ── KEYWORDS ──
function KeywordsTab({ keywords, loading, queueAction }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Keyword Tracker</h3>
        <button className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">+ Add Keywords</button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr><th className="text-left p-3">Keyword</th><th className="text-left p-3">Volume</th><th className="text-left p-3">Difficulty</th><th className="text-left p-3">Position</th><th className="text-left p-3">Intent</th><th className="text-left p-3">Action</th></tr>
            </thead>
            <tbody>
              {keywords.map((kw, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{kw.keyword}</td>
                  <td className="p-3">{kw.volume.toLocaleString()}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${kw.difficulty > 45 ? 'bg-red-100 text-red-600' : kw.difficulty > 30 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{kw.difficulty}</span></td>
                  <td className="p-3">{kw.position || '—'}</td>
                  <td className="p-3 text-xs">{kw.intent}</td>
                  <td className="p-3">
                    <button onClick={() => queueAction({ id: Date.now(), title: `Optimize for "${kw.keyword}"`, reason: `Target volume ${kw.volume}`, risk: 'MEDIUM', impact: 20 })} className="text-xs text-purple-500 hover:text-purple-700">Optimize</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── CONTENT ──
function ContentPlannerTab({ queueAction }) {
  const briefs = [
    { title: 'Ultimate Guide to Personalised Gifts', keyword: 'personalised gifts', status: 'draft', roi: '+180%' },
    { title: 'Best Custom Whisky Glasses 2024', keyword: 'custom whisky glasses', status: 'draft', roi: '+120%' },
    { title: 'Why LED Neon Signs Are Trending', keyword: 'LED neon signs', status: 'needs refresh', roi: '+90%' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Content Calendar</h3>
        <button onClick={() => queueAction({ id: Date.now(), title: 'Generate content brief', reason: 'Based on keyword gap analysis', risk: 'LOW', impact: 25 })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">+ Generate Brief</button>
      </div>
      <div className="grid gap-3">
        {briefs.map((b, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{b.title}</p>
              <p className="text-xs text-gray-500">{b.keyword}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-green-600 font-medium">{b.roi}</span>
              <StatusBadge status={b.status} />
              <button onClick={() => queueAction({ id: Date.now(), title: `Write content: ${b.title}`, reason: 'Content brief ready', risk: 'LOW', impact: 30 })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Write</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COMPETITORS ──
function CompetitorsTab({ competitors }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-4 border-b"><h3 className="font-semibold">Competitor Intelligence</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr><th className="text-left p-3">Competitor</th><th className="text-left p-3">Traffic Share</th><th className="text-left p-3">Keyword Overlap</th><th className="text-left p-3">Strength</th></tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.trafficShare}%</td>
                <td className="p-3">{c.keywordsOverlap}</td>
                <td className="p-3"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${c.strength}%` }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── BACKLINKS ──
function BacklinksTab({ queueAction }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Backlinks', val: 847 }, { label: 'Referring Domains', val: 124 }, { label: 'Toxic Links', val: 12 }].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">{s.label}</p><p className="text-2xl font-bold">{s.val}</p></div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-semibold mb-3">Toxic Links Flagged</h3>
        <p className="text-sm text-gray-500 mb-3">12 toxic links detected — consider submitting a disavow file</p>
        <button onClick={() => queueAction({ id: Date.now(), title: 'Generate disavow file', reason: '12 toxic links detected', risk: 'HIGH', impact: 40 })} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Generate Disavow</button>
      </div>
    </div>
  );
}

// ── ROADMAP ──
function RoadmapTab({ tasks, queueAction, StatusBadge }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-4 border-b"><h3 className="font-semibold">Execution Roadmap</h3></div>
      <div className="divide-y">
        {tasks.map(t => (
          <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${t.priority === 'HIGH' ? 'bg-red-100 text-red-600' : t.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{t.priority}</span>
                <StatusBadge status={t.status} />
                <span className="text-xs text-gray-400">Phase {t.phase}d</span>
                <span className="text-xs text-green-600">+{t.impact}% impact</span>
              </div>
            </div>
            {t.status === 'pending' && (
              <button onClick={() => queueAction({ taskId: t.id, id: t.id, title: t.title, reason: `Impact +${t.impact}%`, risk: t.priority === 'HIGH' ? 'HIGH' : 'MEDIUM', impact: t.impact })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Execute</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── IMPLEMENTATION ──
function ImplementationTab({ queueAction }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Meta Tags', desc: 'View and edit meta titles & descriptions', action: 'Open Meta Editor' },
          { label: 'Schema Library', desc: 'JSON-LD schemas for all page types', action: 'View Schemas' },
          { label: 'Redirect Manager', desc: 'Manage 301 redirects', action: 'Manage Redirects' },
          { label: 'Robots.txt', desc: 'Edit robots.txt rules', action: 'Edit Robots.txt' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border">
            <h4 className="font-semibold text-sm mb-1">{c.label}</h4>
            <p className="text-xs text-gray-500 mb-3">{c.desc}</p>
            <button onClick={() => queueAction({ id: Date.now(), title: `Open ${c.label}`, reason: c.desc, risk: 'LOW', impact: 10 })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">{c.action}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ANALYTICS ──
function AnalyticsTab({ analytics, loading }) {
  if (!analytics) return <LoadingSpinner />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Daily Traffic</p><p className="text-xl font-bold">{analytics.organicTraffic.daily.toLocaleString()}</p><span className="text-xs text-green-600">{analytics.organicTraffic.trend}</span></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Monthly Traffic</p><p className="text-xl font-bold">{analytics.organicTraffic.monthly.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Organic Leads</p><p className="text-xl font-bold">{analytics.organicLeads.count}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Organic Revenue</p><p className="text-xl font-bold">₹{analytics.organicLeads.revenue.toLocaleString()}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h4 className="font-semibold text-sm mb-3">Ranking Distribution</h4>
          <div className="space-y-2">
            {[
              { label: '#1-3', val: analytics.rankingDistribution.top3, color: 'bg-green-500' },
              { label: '#4-10', val: analytics.rankingDistribution.top10, color: 'bg-blue-500' },
              { label: '#11-20', val: analytics.rankingDistribution.top20, color: 'bg-yellow-500' },
              { label: 'Beyond', val: analytics.rankingDistribution.beyond, color: 'bg-gray-400' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs w-12">{r.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3"><div className={`${r.color} h-3 rounded-full`} style={{ width: `${(r.val / 168) * 100}%` }} /></div>
                <span className="text-xs w-8 text-right">{r.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h4 className="font-semibold text-sm mb-3">Core Web Vitals</h4>
          {[
            { label: 'LCP', val: `${analytics.coreWebVitals.lcp}s`, status: analytics.coreWebVitals.lcp < 2.5 ? 'Good' : 'Needs Improvement' },
            { label: 'FID', val: `${analytics.coreWebVitals.fid}ms`, status: analytics.coreWebVitals.fid < 100 ? 'Good' : 'Needs Improvement' },
            { label: 'CLS', val: analytics.coreWebVitals.cls, status: analytics.coreWebVitals.cls < 0.1 ? 'Good' : 'Needs Improvement' },
          ].map((v, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm">{v.label}</span>
              <span className="text-sm font-medium">{v.val}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${v.status === 'Good' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{v.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS ──
function SettingsTab({ copilot, toggleCopilot, execLog }) {
  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-semibold mb-4">Copilot Mode</h3>
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-sm font-medium">Enable Copilot</p><p className="text-xs text-gray-500">Auto-execute low & medium risk tasks</p></div>
          <button onClick={toggleCopilot} className={`relative w-12 h-6 rounded-full transition-colors ${copilot.copilotMode ? 'bg-purple-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${copilot.copilotMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-semibold mb-4">Execution Stats</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-2xl font-bold">{execLog.stats?.total || 0}</p><p className="text-xs text-gray-500">Total</p></div>
          <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{execLog.stats?.succeeded || 0}</p><p className="text-xs text-green-600">Succeeded</p></div>
          <div className="text-center p-3 bg-red-50 rounded-lg"><p className="text-2xl font-bold text-red-600">{execLog.stats?.failed || 0}</p><p className="text-xs text-red-600">Failed</p></div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-semibold mb-4">Connected Tools</h3>
        {['Google Search Console', 'Google Analytics 4'].map((t, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
            <span className="text-sm">{t}</span>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Connected</span>
          </div>
        ))}
      </div>
    </div>
  );
}
