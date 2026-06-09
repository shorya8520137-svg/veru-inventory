'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, LayoutDashboard, Search, FileText, Users, Link2, Route, Wrench, BarChart3, Settings,
  Shield, AlertTriangle, CheckCircle, Clock, Play, X, ChevronRight, Loader2,
  Target, TrendingUp, Globe, BookOpen, Zap, Bot, MessageSquare, Activity, Plus, Edit3, Code, Type, List,
  MapPin, ClipboardCheck
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

async function apiPostLLM(path, body) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const res = await fetch(`${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, authToken: token }),
  });
  return res.json();
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'keywords', label: 'Keywords', icon: Search },
  { id: 'research', label: 'Research', icon: BookOpen },
  { id: 'competitors', label: 'Competitors', icon: Users },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'technical', label: 'Technical', icon: Shield },
  { id: 'backlinks', label: 'Backlinks', icon: Globe },
  { id: 'local-seo', label: 'Local SEO', icon: MapPin },
  { id: 'qa', label: 'QA', icon: ClipboardCheck },
  { id: 'roadmap', label: 'Roadmap', icon: List },
  { id: 'implementation', label: 'Implement', icon: Wrench },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const RISK_COLORS = { LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-yellow-100 text-yellow-700', HIGH: 'bg-red-100 text-red-700' };

function AuthHeaders() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return { 'Content-Type': 'application/json', ...(t && { Authorization: `Bearer ${t}` }) };
}
async function apiGet(p) { const r = await fetch(`${API_BASE}/api/seo${p}`, { headers: AuthHeaders() }); return r.json(); }
async function apiPost(p, b) { const r = await fetch(`${API_BASE}/api/seo${p}`, { method: 'POST', headers: AuthHeaders(), body: JSON.stringify(b || {}) }); return r.json(); }

function LoadingSpinner() { return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>; }
function StatusBadge({ s }) { const c = { completed: 'bg-green-100 text-green-600', pending: 'bg-yellow-100 text-yellow-600', 'in-progress': 'bg-blue-100 text-blue-600', done: 'bg-green-100 text-green-600', failed: 'bg-red-100 text-red-600' }; return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>; }

// ── CHATGPT-STYLE EXECUTION MODAL ──
function getSteps(title) {
  const t = title.toLowerCase();
  if (t.startsWith('write content') || t.startsWith('generate content') || t.startsWith('write'))
    return ['Researching topic and keywords', 'Outlining content structure', 'Writing SEO-optimized draft', 'Adding internal links and CTAs', 'Proofreading and formatting'];
  if (t.includes('faq schema') || t.includes('add faq'))
    return ['Identifying product page template', 'Creating FAQ JSON-LD template', 'Adding to all product pages', 'Testing with Rich Results tool'];
  if (t.includes('meta title') || t.includes('optimize meta'))
    return ['Extracting top 10 products by traffic', 'Analyzing current title lengths', 'Writing optimized titles (55-60 chars)', 'Updating product page titles'];
  if (t.includes('alt tag'))
    return ['Scanning product images for missing alt tags', 'Generating descriptive alt text via AI', 'Updating image alt attributes', 'Verifying fix across pages'];
  if (t.includes('disavow'))
    return ['Fetching toxic link report', 'Analyzing link quality scores', 'Generating disavow.txt', 'Preparing submission'];
  if (t.includes('meta editor') || t.includes('update meta'))
    return ['Loading current meta tags', 'Analyzing CTR optimization opportunities', 'Applying new meta titles', 'Verifying changes'];
  if (t.includes('product schema') || t.includes('apply schema'))
    return ['Extracting product data', 'Generating JSON-LD structured data', 'Validating schema markup', 'Deploying to product pages'];
  if (t.includes('schema'))
    return ['Loading schema library', 'Checking existing schema coverage', 'Recommending missing schema types', 'Generating schema templates'];
  if (t.includes('robots') || t.includes('redirect'))
    return ['Loading current configuration', 'Analyzing for issues', 'Preparing changes', 'Ready for review'];
  if (t.includes('brief') || t.includes('content'))
    return ['Analyzing keyword gaps', 'Researching top-ranking content', 'Creating content outline', 'Generating SEO brief'];
  if (t.includes('description') || t.includes('generate meta'))
    return ['Scanning pages missing descriptions', 'Analyzing product context', 'Writing unique meta descriptions', 'Applying to pages'];
  return ['Initializing', 'Analyzing target', 'Applying changes', 'Verifying results'];
}

function ExecutionModal({ action, onClose }) {
  const stepsList = getSteps(action.title);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepStates, setStepStates] = useState([]);
  const [done, setDone] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const startRef = useRef(Date.now());
  const bottomRef = useRef(null);

  useEffect(() => {
    let completedCount = 0;
    const interval = setInterval(() => {
      if (completedCount < stepsList.length) {
        const stepLabel = stepsList[completedCount];
        const startedAt = Date.now();
        setStepStates(prev => [...prev, { label: stepLabel, status: 'running' }]);
        setCurrentIndex(completedCount);

        const delay = 500 + Math.random() * 1000;
        setTimeout(() => {
          const duration = ((Date.now() - startedAt) / 1000).toFixed(1);
          setStepStates(prev => prev.map((s, idx) => idx === completedCount ? { ...s, status: 'done', duration } : s));
          completedCount++;

          if (completedCount >= stepsList.length) {
            clearInterval(interval);
            setDone(true);
            setTotalTime(((Date.now() - startRef.current) / 1000).toFixed(1));
          }
        }, delay);
      }
    }, 700);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [stepStates]);

  const successCount = stepStates.filter(s => s.status === 'done').length;
  const failedCount = stepStates.filter(s => s.status === 'failed').length;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-sm font-medium text-white truncate">{action.title}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white shrink-0 ml-2"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2">
          <div className="text-gray-500 mb-3">$ seo-agent execute &ldquo;{action.title}&rdquo;</div>
          {stepStates.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              {step.status === 'running' ? (
                <span className="text-yellow-400 shrink-0 mt-0.5"><Loader2 className="w-4 h-4 animate-spin" /></span>
              ) : step.status === 'done' ? (
                <span className="text-green-400 shrink-0 mt-0.5"><CheckCircle className="w-4 h-4" /></span>
              ) : (
                <span className="text-gray-600 shrink-0 mt-0.5"><Clock className="w-4 h-4" /></span>
              )}
              <div className="flex-1 min-w-0">
                <span className={step.status === 'running' ? 'text-yellow-300' : step.status === 'done' ? 'text-green-300' : 'text-gray-500'}>
                  {step.label}
                </span>
                {step.duration && <span className="text-gray-500 ml-2">({step.duration}s)</span>}
              </div>
            </div>
          ))}
          {!done && <span className="text-gray-500 animate-pulse">▊</span>}
          {done && (
            <div className="space-y-3 mt-4">
              <div className="p-3 rounded-lg bg-green-900/50 text-green-300">
                ✅ Task completed — {successCount}/{stepsList.length} steps in {totalTime}s
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ADD KEYWORD MODAL ──
function AddKeywordModal({ onClose, onAdd }) {
  const [kw, setKw] = useState('');
  const [vol, setVol] = useState('1000');
  const [diff, setDiff] = useState('30');
  async function handleSubmit() {
    if (!kw.trim()) return;
    await apiPost('/keywords/add', { keyword: kw, volume: Number(vol), difficulty: Number(diff) });
    onAdd(kw);
    onClose();
  }
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Add Keyword</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs text-gray-500 block mb-1">Keyword</label><input value={kw} onChange={e => setKw(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="e.g. personalised gifts" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Search Volume</label><input value={vol} onChange={e => setVol(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" type="number" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Difficulty (0-100)</label><input value={diff} onChange={e => setDiff(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min="0" max="100" /></div>
          </div>
          <button onClick={handleSubmit} className="w-full bg-purple-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600">Add to Tracker</button>
        </div>
      </div>
    </div>
  );
}

// ── GENERATE BRIEF MODAL ──
function GenerateBriefModal({ onClose, onGenerate }) {
  const [topic, setTopic] = useState('');
  const [kw, setKw] = useState('');
  async function handleGen() {
    onGenerate(topic || kw || 'SEO content');
    onClose();
  }
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-lg mb-4">Generate Content Brief</h3>
        <div className="space-y-3">
          <div><label className="text-xs text-gray-500 block mb-1">Topic</label><input value={topic} onChange={e => setTopic(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Ultimate Guide to Personalised Gifts" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Target Keyword</label><input value={kw} onChange={e => setKw(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. personalised gifts" /></div>
          <button onClick={handleGen} className="w-full bg-purple-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600">Generate Brief</button>
        </div>
      </div>
    </div>
  );
}

// ── META EDITOR MODAL ──
function MetaEditorModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-lg mb-4">Meta Tag Editor</h3>
        <div className="space-y-3">
          <div><label className="text-xs text-gray-500 block mb-1">Meta Title <span className="text-gray-400">({title.length}/60)</span></label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" maxLength={60} placeholder="Buy Personalised Gifts Online | Brand" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Meta Description <span className="text-gray-400">({desc.length}/160)</span></label><textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm h-20" maxLength={160} placeholder="Discover unique personalised gifts..." /></div>
          <div className="flex gap-2">
            <button onClick={() => { apiPost('/implementation/meta/homepage', { title, description: desc }); onClose(); }} className="flex-1 bg-purple-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600">Save Meta</button>
            <button onClick={onClose} className="px-4 py-2.5 border rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SCHEMA EDITOR MODAL ──
function SchemaEditorModal({ onClose }) {
  const [schema, setSchema] = useState(JSON.stringify({ "@context": "https://schema.org", "@type": "Product", "name": "", "description": "", "offers": { "@type": "Offer", "price": "", "priceCurrency": "INR" } }, null, 2));
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-lg mb-4">Schema Markup Editor</h3>
        <textarea value={schema} onChange={e => setSchema(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs font-mono h-48 focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <div className="flex gap-2 mt-3">
          <button onClick={() => { apiPost('/schema/product-page', { schema }); onClose(); }} className="flex-1 bg-purple-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600">Apply Schema</button>
          <button onClick={onClose} className="px-4 py-2.5 border rounded-lg text-sm text-gray-600">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ──
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
  const [execAction, setExecAction] = useState(null);
  const [showAddKw, setShowAddKw] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [customBriefs, setCustomBriefs] = useState([]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { loadCopilotStatus(); loadAudit(); loadKeywords(); loadCompetitors(); loadTasks(); loadAnalytics(); loadExecLog(); }, []);

  async function loadCopilotStatus() { const d = await apiGet('/copilot/status'); if (d.success) setCopilot(d.data); }
  async function loadAudit() { const d = await apiGet('/audit/status'); if (d.success) setAuditData(d.data); }
  async function runAudit() { const d = await apiPost('/audit/run'); if (d.success) setAuditData(d.data); showToast('Audit complete!'); loadExecLog(); }
  async function loadKeywords() { setLoading(k => ({ ...k, keywords: true })); const d = await apiGet('/keywords'); if (d.success) setKeywords(d.data); setLoading(k => ({ ...k, keywords: false })); }
  async function loadCompetitors() { const d = await apiGet('/competitors'); if (d.success) setCompetitors(d.data); }
  async function loadTasks() { const d = await apiGet('/tasks'); if (d.success) setTasks(d.data); }
  async function loadAnalytics() { const d = await apiGet('/analytics/dashboard'); if (d.success) setAnalytics(d.data); }
  async function loadExecLog() { const d = await apiGet('/execution-log?limit=20'); if (d.success) setExecLog(d); }

  async function toggleCopilot() {
    const d = await apiPost('/copilot/toggle');
    if (d.success) { setCopilot(c => ({ ...c, copilotMode: d.copilotMode })); showToast(d.copilotMode ? 'Copilot ON' : 'Copilot OFF'); loadExecLog(); }
  }

  function startExecution(action) {
    if (copilot.copilotMode) { setExecAction(action); return; }
    setExecAction(action);
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
        <div className="absolute flex items-center justify-center" style={{ width: size, height: size }}><span className="text-2xl font-bold" style={{ color }}>{score}</span></div>
        {label && <span className="text-xs text-gray-500 mt-1">{label}</span>}
      </div>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab auditData={auditData} tasks={tasks} copilot={copilot} analytics={analytics} startExecution={startExecution} ScoreRing={ScoreRing} execLog={execLog} loadExecLog={loadExecLog} />;
      case 'keywords': return <KeywordsTab keywords={keywords} loading={loading.keywords} startExecution={startExecution} onAddClick={() => setShowAddKw(true)} />;
      case 'research': return <ResearchTab startExecution={startExecution} />;
      case 'competitors': return <CompetitorsTab competitors={competitors} />;
      case 'content': return <ContentPlannerTab startExecution={startExecution} onBriefClick={() => setShowBrief(true)} customBriefs={customBriefs} />;
      case 'technical': return <AuditTab auditData={auditData} runAudit={runAudit} ScoreRing={ScoreRing} startExecution={startExecution} />;
      case 'backlinks': return <BacklinksTab startExecution={startExecution} />;
      case 'local-seo': return <LocalSEOTab startExecution={startExecution} />;
      case 'qa': return <QATab startExecution={startExecution} />;
      case 'roadmap': return <RoadmapTab tasks={tasks} startExecution={startExecution} StatusBadge={StatusBadge} />;
      case 'implementation': return <ImplementationTab startExecution={startExecution} onMetaClick={() => setShowMeta(true)} onSchemaClick={() => setShowSchema(true)} />;
      case 'analytics': return <AnalyticsTab analytics={analytics} loading={loading.analytics} />;
      case 'settings': return <SettingsTab copilot={copilot} toggleCopilot={toggleCopilot} execLog={execLog} />;
      default: return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      {execAction && <ExecutionModal action={execAction} onClose={() => { setExecAction(null); loadTasks(); loadExecLog(); }} />}
      {showAddKw && <AddKeywordModal onClose={() => setShowAddKw(false)} onAdd={(kw) => { showToast(`Keyword "${kw}" added`); loadKeywords(); loadExecLog(); }} />}
      {showBrief && <GenerateBriefModal onClose={() => setShowBrief(false)} onGenerate={(topic) => { setCustomBriefs(p => [{ title: topic, keyword: topic.toLowerCase().replace(/\s+/g, ' '), status: 'draft', roi: '+150%' }, ...p]); showToast(`Brief generated for "${topic}"`); loadExecLog(); }} />}
      {showMeta && <MetaEditorModal onClose={() => { setShowMeta(false); loadExecLog(); }} />}
      {showSchema && <SchemaEditorModal onClose={() => { setShowSchema(false); loadExecLog(); }} />}

      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-end py-3">
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
function DashboardTab({ auditData, tasks, copilot, analytics, startExecution, ScoreRing, execLog, loadExecLog }) {
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [querying, setQuerying] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('0');
  const pending = tasks.filter(t => t.status === 'pending').length;
  const score = auditData?.overall || 0;
  const quickWins = [
    { title: 'Add FAQ schema to product pages', reason: 'Enables rich results in SERP', risk: 'LOW', impact: 25 },
    { title: 'Optimize meta titles (top 10 products)', reason: 'Improves CTR from search results', risk: 'LOW', impact: 20 },
    { title: 'Fix missing alt tags', reason: 'Improves image search visibility', risk: 'LOW', impact: 15 },
  ];
  const PHASES = [
    { id: '0', label: 'Auto-detect' },
    { id: '1', label: 'Phase 1: Research & Discovery' },
    { id: '2', label: 'Phase 2: Documentation' },
    { id: '3', label: 'Phase 3: Competitor Analysis' },
    { id: '4', label: 'Phase 4: Keyword Engineering' },
    { id: '5', label: 'Phase 5: Topical Authority' },
    { id: '6', label: 'Phase 6: Technical SEO' },
    { id: '7', label: 'Phase 7: Content Engineering' },
    { id: '8', label: 'Phase 8: Backlink Engineering' },
    { id: '9', label: 'Phase 9: Local SEO' },
    { id: '10', label: 'Phase 10: Execution Plan' },
    { id: '11', label: 'Phase 11: Implementation' },
    { id: '12', label: 'Phase 12: Quality Assurance' },
    { id: '13', label: 'Phase 13: Continuous Learning' },
  ];
  async function askInventoryGPT() {
    if (!query.trim()) return;
    setQuerying(true);
    if (selectedPhase !== '0') {
      const llm = await apiPost('/llm-phase', { query, phase: selectedPhase });
      if (llm.success) {
        setQueryResult({ type: 'llm', answer: llm.data.answer, model: llm.data.model, phase: selectedPhase });
      } else {
        setQueryResult({ type: 'llm', answer: `Phase-specific analysis unavailable: ${llm.message}`, model: 'fallback' });
      }
    } else {
      const llm = await apiPost('/llm-query', { query });
      if (llm.success) {
        setQueryResult({ type: 'llm', answer: llm.data.answer, model: llm.data.model });
      } else {
        const d = await apiPost('/inventorygpt-query', { query });
        if (d.success) setQueryResult({ type: 'rule', ...d.data });
      }
    }
    setQuerying(false);
    loadExecLog();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-3">
          <div className="relative"><ScoreRing score={score} size={80} /></div>
          <div><p className="text-xs text-gray-500">SEO Health</p><p className="text-lg font-bold">{score}/100</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Tasks Queued</p><p className="text-2xl font-bold">{pending}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Copilot</p><p className="text-2xl font-bold">{copilot.copilotMode ? 'ON' : 'OFF'}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Executions</p><p className="text-2xl font-bold">{execLog.stats?.total || 0}</p></div>
      </div>

      {/* InventoryGPT */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <div className="flex items-center gap-2 mb-3"><Bot className="w-5 h-5 text-purple-500" /><h3 className="font-semibold">Ask InventoryGPT for SEO</h3></div>
        <p className="text-xs text-gray-500 mb-3">Try: "suggest keywords", "optimize meta titles", "check schema", "content ideas", "find technical issues"</p>
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 flex gap-2 min-w-0">
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && askInventoryGPT()} placeholder="e.g. suggest keywords for my products..." className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 min-w-0" />
            <select value={selectedPhase} onChange={e => setSelectedPhase(e.target.value)} className="border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 w-44">
              {PHASES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <button onClick={askInventoryGPT} disabled={querying} className="bg-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2">
            {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}{querying ? 'Analyzing...' : 'Ask'}
          </button>
        </div>
        {queryResult && (
          <div className="mt-4 space-y-2">
            {queryResult.type === 'llm' ? (
              <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-purple-600 font-medium">LLM Response ({queryResult.model}){queryResult.phase ? ` · Phase ${queryResult.phase}` : ''}</span>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{queryResult.answer}</div>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400">Found {queryResult.productCount} products, {queryResult.categoryCount} categories</p>
                {queryResult.insights?.map((ins, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="flex-1"><p className="text-sm font-medium">{ins.title}</p><p className="text-xs text-gray-500">{ins.reason}</p><span className="text-xs text-green-600">{ins.impact}</span></div>
                    <button onClick={() => startExecution({ title: ins.action, reason: ins.reason })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 ml-2">Run</button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Wins */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-3">Quick Wins</h3>
        <div className="space-y-2">
          {quickWins.map((w, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <div className="flex-1"><p className="text-sm font-medium">{w.title}</p><p className="text-xs text-gray-500">{w.reason}</p><span className={`text-xs px-1.5 py-0.5 rounded ${RISK_COLORS[w.risk]}`}>{w.risk}</span></div>
              <div className="flex items-center gap-2"><span className="text-xs text-green-600">+{w.impact}%</span><button onClick={() => startExecution(w)} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Execute</button></div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Log */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-purple-500" /> Recent Log</h3><button onClick={loadExecLog} className="text-xs text-purple-500 hover:text-purple-700">Refresh</button></div>
        {execLog.data.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">No executions yet.</p> : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {execLog.data.map((log, i) => (
              <div key={log.id || i} className="flex items-center gap-2 p-2 text-xs text-gray-600 hover:bg-gray-50 rounded">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.status === 'completed' || log.status === 'done' ? 'bg-green-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className="text-gray-400 w-16 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="font-medium text-gray-700 shrink-0">{log.action}</span>
                <span className="truncate">{log.details}</span>
                {log.duration && <span className="text-gray-400 shrink-0">{(log.duration / 1000).toFixed(1)}s</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AUDIT ──
function AuditTab({ auditData, runAudit, ScoreRing, startExecution }) {
  const categories = auditData ? Object.entries(auditData).filter(([k]) => k !== 'overall' && k !== 'lastRun' && k !== 'issues') : [];
  const issues = [
    { problem: 'Missing meta descriptions on 12 pages', severity: 'Warning', fix: 'Generate meta descriptions' },
    { problem: 'No FAQ schema on product pages', severity: 'Info', fix: 'Add FAQ schema' },
    { problem: '3 broken internal links', severity: 'Critical', fix: 'Fix or redirect broken links' },
  ];
  return (
    <div className="space-y-6">
      <button onClick={runAudit} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 flex items-center gap-2"><Play className="w-4 h-4" /> Run Audit</button>
      {auditData ? (
        <>
          <div className="flex items-center gap-6 mb-4"><div className="relative"><ScoreRing score={auditData.overall} size={120} /></div><p className="text-sm text-gray-500">Last run: {new Date(auditData.lastRun).toLocaleString()}</p></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map(([key, val]) => (<div key={key} className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p><p className="text-xl font-bold">{val}</p></div>))}
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <h3 className="font-semibold mb-3">Issues Found</h3>
            <div className="space-y-2">
              {issues.map((iss, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div><p className="text-sm font-medium">{iss.problem}</p><span className={`text-xs px-1.5 py-0.5 rounded ${iss.severity === 'Critical' ? 'bg-red-100 text-red-600' : iss.severity === 'Warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>{iss.severity}</span></div>
                  <button onClick={() => startExecution({ title: iss.fix, reason: iss.problem })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Fix</button>
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
function KeywordsTab({ keywords, loading, startExecution, onAddClick }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Keyword Tracker</h3>
        <button onClick={onAddClick} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Keywords</button>
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
                  <td className="p-3"><button onClick={() => startExecution({ title: `Update meta title`, reason: `Optimize for "${kw.keyword}"` })} className="text-xs text-purple-500 hover:text-purple-700">Optimize</button></td>
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
function ContentPlannerTab({ startExecution, onBriefClick, customBriefs }) {
  const defaultBriefs = [
    { title: 'Ultimate Guide to Personalised Gifts', keyword: 'personalised gifts', status: 'draft', roi: '+180%' },
    { title: 'Best Custom Whisky Glasses 2024', keyword: 'custom whisky glasses', status: 'draft', roi: '+120%' },
    { title: 'Why LED Neon Signs Are Trending', keyword: 'LED neon signs', status: 'needs refresh', roi: '+90%' },
  ];
  const briefs = [...customBriefs, ...defaultBriefs];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Content Calendar</h3>
        <button onClick={onBriefClick} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Generate Brief</button>
      </div>
      <div className="grid gap-3">
        {briefs.map((b, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between">
            <div><p className="text-sm font-medium">{b.title}</p><p className="text-xs text-gray-500">{b.keyword}</p></div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-green-600 font-medium">{b.roi}</span>
              <StatusBadge s={b.status} />
              <button onClick={() => startExecution({ title: `Write content: ${b.title}`, reason: 'Content brief ready' })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Write</button>
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
          <thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="text-left p-3">Competitor</th><th className="text-left p-3">Traffic Share</th><th className="text-left p-3">Keyword Overlap</th><th className="text-left p-3">Strength</th></tr></thead>
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
function BacklinksTab({ startExecution }) {
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
        <button onClick={() => startExecution({ title: 'Generate disavow file', reason: '12 toxic links detected' })} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Generate Disavow</button>
      </div>
    </div>
  );
}

// ── ROADMAP ──
function RoadmapTab({ tasks, startExecution, StatusBadge }) {
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
                <StatusBadge s={t.status} />
                <span className="text-xs text-gray-400">Phase {t.phase}d</span>
                <span className="text-xs text-green-600">+{t.impact}% impact</span>
              </div>
            </div>
            {t.status === 'pending' && (
              <button onClick={() => startExecution(t)} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Execute</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── IMPLEMENTATION ──
function ImplementationTab({ startExecution, onMetaClick, onSchemaClick }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h4 className="font-semibold text-sm mb-1">Meta Tags</h4>
          <p className="text-xs text-gray-500 mb-3">View and edit meta titles & descriptions</p>
          <button onClick={onMetaClick} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 flex items-center gap-1"><Type className="w-3 h-3" /> Open Meta Editor</button>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h4 className="font-semibold text-sm mb-1">Schema Library</h4>
          <p className="text-xs text-gray-500 mb-3">JSON-LD schemas for all page types</p>
          <button onClick={onSchemaClick} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 flex items-center gap-1"><Code className="w-3 h-3" /> View Schemas</button>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h4 className="font-semibold text-sm mb-1">Redirect Manager</h4>
          <p className="text-xs text-gray-500 mb-3">Manage 301 redirects</p>
          <button onClick={() => startExecution({ title: 'Manage Redirects', reason: 'Manage 301 redirect rules' })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Manage Redirects</button>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h4 className="font-semibold text-sm mb-1">Robots.txt</h4>
          <p className="text-xs text-gray-500 mb-3">Edit robots.txt rules</p>
          <button onClick={() => startExecution({ title: 'Edit Robots.txt', reason: 'Edit robots.txt rules' })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Edit Robots.txt</button>
        </div>
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
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Revenue</p><p className="text-xl font-bold">₹{analytics.organicLeads.revenue.toLocaleString()}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h4 className="font-semibold text-sm mb-3">Ranking Distribution</h4>
          <div className="space-y-2">
            {[{ label: '#1-3', val: analytics.rankingDistribution.top3, color: 'bg-green-500' }, { label: '#4-10', val: analytics.rankingDistribution.top10, color: 'bg-blue-500' }, { label: '#11-20', val: analytics.rankingDistribution.top20, color: 'bg-yellow-500' }, { label: 'Beyond', val: analytics.rankingDistribution.beyond, color: 'bg-gray-400' }].map((r, i) => (
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
          {[{ label: 'LCP', val: `${analytics.coreWebVitals.lcp}s`, status: analytics.coreWebVitals.lcp < 2.5 ? 'Good' : 'Needs Improvement' }, { label: 'FID', val: `${analytics.coreWebVitals.fid}ms`, status: analytics.coreWebVitals.fid < 100 ? 'Good' : 'Needs Improvement' }, { label: 'CLS', val: analytics.coreWebVitals.cls, status: analytics.coreWebVitals.cls < 0.1 ? 'Good' : 'Needs Improvement' }].map((v, i) => (
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

// ── RESEARCH & DISCOVERY (Phase 1-2) ──
function ResearchTab({ startExecution }) {
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const d = await apiGet('/research'); if (d.success) setResearch(d.data); setLoading(false); })(); }, []);
  if (loading) return <LoadingSpinner />;
  if (!research) return <p className="text-gray-400 text-center py-12">No research data available</p>;
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-500" /> Business Model</h3>
        <p className="text-sm text-gray-700">{research.business.model}</p>
        <p className="text-xs text-gray-500 mt-1">Products: {research.business.products}</p>
        <p className="text-xs text-gray-500">Revenue: {research.business.revenueModel}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h4 className="font-semibold text-sm mb-2">Industry Trends</h4>
          <p className="text-xs text-gray-500 mb-2">{research.industry.marketSize}</p>
          <div className="space-y-1">
            {research.industry.trends.map((t, i) => (<div key={i} className="flex items-center gap-2 text-xs text-gray-600"><TrendingUp className="w-3 h-3 text-green-500" />{t}</div>))}
          </div>
          <h4 className="font-semibold text-sm mt-3 mb-2">Opportunities</h4>
          <div className="space-y-1">
            {research.industry.opportunities.map((o, i) => (<div key={i} className="flex items-center gap-2 text-xs text-gray-600"><Zap className="w-3 h-3 text-yellow-500" />{o}</div>))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h4 className="font-semibold text-sm mb-2">Target Audience</h4>
          <p className="text-xs text-gray-500 mb-2"><span className="font-medium">ICP:</span> {research.audience.icp}</p>
          <p className="text-xs text-gray-500 mb-2"><span className="font-medium">Pain Points:</span></p>
          <div className="space-y-1 mb-3">
            {research.audience.painPoints.map((p, i) => (<div key={i} className="flex items-center gap-2 text-xs text-gray-600"><AlertTriangle className="w-3 h-3 text-red-400" />{p}</div>))}
          </div>
          <p className="text-xs text-gray-500"><span className="font-medium">Journey:</span> {research.audience.journey.join(' → ')}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h4 className="font-semibold text-sm mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => startExecution({ title: 'Deep dive competitor analysis', reason: 'Research competitors' })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Competitor Deep Dive</button>
          <button onClick={() => startExecution({ title: 'Generate market research report', reason: 'Market analysis' })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Market Report</button>
          <button onClick={() => startExecution({ title: 'Build audience persona', reason: 'Audience analysis' })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Audience Persona</button>
        </div>
      </div>
    </div>
  );
}

// ── LOCAL SEO (Phase 9) ──
function LocalSEOTab({ startExecution }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const d = await apiGet('/local-seo'); if (d.success) setData(d.data); setLoading(false); })(); }, []);
  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-gray-400 text-center py-12">No local SEO data available</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">GBP Claimed</p><p className="text-lg font-bold">{data.googleBusiness.claimed ? 'Yes' : 'No'}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">GBP Verified</p><p className="text-lg font-bold">{data.googleBusiness.verified ? 'Yes' : 'No'}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Total Citations</p><p className="text-lg font-bold">{data.citations.total}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border"><p className="text-xs text-gray-500">Reviews</p><p className="text-lg font-bold">{data.reviews.total}</p></div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h4 className="font-semibold text-sm mb-3">NAP Consistency</h4>
        <p className="text-sm text-gray-500">{data.nap.consistency} — {data.nap.sources.length} sources checked</p>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h4 className="font-semibold text-sm mb-3">Recommendations</h4>
        <div className="space-y-2">
          {data.recommendations.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1"><p className="text-sm font-medium">{r.action}</p><span className={`text-xs px-1.5 py-0.5 rounded ${r.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{r.priority}</span></div>
              <div className="flex items-center gap-2"><span className="text-xs text-green-600">{r.impact}</span><button onClick={() => startExecution({ title: r.action, reason: r.impact })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Execute</button></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h4 className="font-semibold text-sm mb-2">Top Citation Directories</h4>
        <div className="flex flex-wrap gap-2">
          {data.citations.topDirectories.map((d, i) => (<span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{d}</span>))}
        </div>
      </div>
    </div>
  );
}

// ── QUALITY ASSURANCE (Phase 12) ──
function QATab({ startExecution }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const d = await apiGet('/quality-assurance'); if (d.success) setData(d.data); setLoading(false); })(); }, []);
  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-gray-400 text-center py-12">No QA data available</p>;
  const statusColor = { pass: 'bg-green-100 text-green-600', warning: 'bg-yellow-100 text-yellow-600', fail: 'bg-red-100 text-red-600', 'needs-work': 'bg-orange-100 text-orange-600' };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Compliance Overview</h3>
          <span className={`text-sm px-2 py-1 rounded font-medium ${data.overallCompliance === 'Pass' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{data.overallCompliance}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.checks.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {c.status === 'pass' ? <CheckCircle className="w-4 h-4 text-green-500" /> : c.status === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-500" /> : c.status === 'fail' ? <X className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-orange-500" />}
                <div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-gray-500">{c.detail}</p></div>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${statusColor[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h4 className="font-semibold text-sm mb-3">Remediation Plan</h4>
        <div className="space-y-2">
          {data.recommendations.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1"><p className="text-sm font-medium">{r.issue}</p><p className="text-xs text-gray-500">{r.fix}</p></div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${r.priority === 'HIGH' ? 'bg-red-100 text-red-600' : r.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>{r.priority}</span>
                <button onClick={() => startExecution({ title: r.fix, reason: r.issue })} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Fix</button>
              </div>
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
    </div>
  );
}
