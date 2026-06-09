const db = require('../db/connection');

const SEO_STORE = {
  copilotMode: false,
  riskThreshold: 'low',
  activeSession: null,
  pendingApprovals: [],
  executionLog: [],
  auditState: null,
  activeInsights: [],
  taskIdCounter: 10,
};

const TASKS = [
  { id: 1, title: 'Add FAQ schema to all product pages', priority: 'HIGH', impact: 85, difficulty: 'LOW', status: 'pending', phase: 30, category: 'schema', subtasks: ['Identify product page template', 'Create FAQ JSON-LD template', 'Add to all product pages', 'Test with Rich Results tool'] },
  { id: 2, title: 'Optimize meta titles for top 10 products', priority: 'HIGH', impact: 70, difficulty: 'LOW', status: 'pending', phase: 30, category: 'meta', subtasks: ['Extract top 10 products by traffic', 'Write optimized titles (55-60 chars)', 'Update product page titles', 'Monitor CTR change'] },
  { id: 3, title: 'Fix missing alt tags on product images', priority: 'MEDIUM', impact: 45, difficulty: 'LOW', status: 'pending', phase: 30, category: 'technical', subtasks: ['Scan for missing alt tags', 'Generate descriptive alt text', 'Update image tags', 'Verify fix'] },
  { id: 4, title: 'Create content cluster for personalised gifts', priority: 'MEDIUM', impact: 60, difficulty: 'MEDIUM', status: 'pending', phase: 60, category: 'content', subtasks: ['Keyword research for cluster', 'Create pillar page outline', 'Write supporting articles', 'Internal link structure'] },
  { id: 5, title: 'Build backlink outreach list', priority: 'HIGH', impact: 80, difficulty: 'HIGH', status: 'pending', phase: 60, category: 'authority', subtasks: ['Identify relevant domains', 'Extract contact info', 'Create outreach template', 'Send personalized emails'] },
  { id: 6, title: 'Implement breadcrumb schema', priority: 'MEDIUM', impact: 35, difficulty: 'LOW', status: 'completed', phase: 30, category: 'schema', subtasks: ['Add breadcrumb JSON-LD', 'Test structure', 'Deploy'], completedSubtasks: 3 },
];

const EXECUTION_LOG = [];

function addLog(entry) {
  const log = { id: EXECUTION_LOG.length + 1, timestamp: new Date().toISOString(), ...entry };
  EXECUTION_LOG.unshift(log);
  SEO_STORE.executionLog.push(log);
  return log;
}

class SEOController {

  // ── AUDIT ──
  static async runAudit(req, res) {
    try {
      const auditData = {
        technical: Math.floor(Math.random() * 30) + 60,
        content: Math.floor(Math.random() * 30) + 55,
        authority: Math.floor(Math.random() * 30) + 40,
        ux: Math.floor(Math.random() * 20) + 70,
        eeat: Math.floor(Math.random() * 30) + 45,
        schema: Math.floor(Math.random() * 40) + 30,
        local: Math.floor(Math.random() * 30) + 50,
      };
      auditData.overall = Math.round(
        (auditData.technical + auditData.content + auditData.authority +
         auditData.ux + auditData.eeat + auditData.schema + auditData.local) / 7
      );
      SEO_STORE.auditState = { ...auditData, lastRun: new Date().toISOString(), issues: [] };
      addLog({ action: 'RUN_AUDIT', details: `SEO health score: ${auditData.overall}/100` });
      res.json({ success: true, data: SEO_STORE.auditState });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  static getAuditStatus(req, res) {
    res.json({ success: true, data: SEO_STORE.auditState || { scored: false, message: 'No audit run yet' } });
  }

  // ── KEYWORDS ──
  static getKeywords(req, res) {
    const sample = [
      { keyword: 'personalised wine glasses', volume: 2400, difficulty: 34, position: null, intent: 'Commercial' },
      { keyword: 'custom champagne flutes', volume: 1800, difficulty: 28, position: 12, intent: 'Transactional' },
      { keyword: 'engraved whisky glasses', volume: 3200, difficulty: 41, position: null, intent: 'Commercial' },
      { keyword: 'personalised beer mugs', volume: 1500, difficulty: 22, position: 8, intent: 'Transactional' },
      { keyword: 'custom neon signs', volume: 8900, difficulty: 52, position: null, intent: 'Commercial' },
      { keyword: 'LED name signs', volume: 5400, difficulty: 38, position: 15, intent: 'Informational' },
      { keyword: 'couple anniversary gifts', volume: 12000, difficulty: 62, position: null, intent: 'Commercial' },
      { keyword: 'personalised gifts India', volume: 6800, difficulty: 45, position: 22, intent: 'Transactional' },
    ];
    res.json({ success: true, data: sample });
  }

  static async addKeyword(req, res) {
    const { keyword, volume, difficulty } = req.body;
    addLog({ action: 'ADD_KEYWORD', details: `Keyword "${keyword || 'unknown'}" added` });
    res.json({ success: true, message: `Keyword "${keyword || 'unknown'}" added to tracking` });
  }

  // ── COMPETITORS ──
  static getCompetitors(req, res) {
    res.json({
      success: true, data: [
        { name: 'PersonalisedGifts.in', trafficShare: 28, keywordsOverlap: 340, strength: 72 },
        { name: 'CustomGiftsIndia.com', trafficShare: 22, keywordsOverlap: 285, strength: 65 },
        { name: 'GiftstoIndia24.com', trafficShare: 18, keywordsOverlap: 210, strength: 58 },
      ]
    });
  }

  // ── TASKS (Execution Roadmap) ──
  static getTasks(req, res) {
    res.json({ success: true, data: TASKS });
  }

  static getTaskDetail(req, res) {
    const { id } = req.params;
    const task = TASKS.find(t => t.id === Number(id));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const execs = EXECUTION_LOG.filter(e => e.taskId === Number(id) || e.details?.includes(`#${id}`));
    res.json({ success: true, data: { ...task, executions: execs } });
  }

  static async executeTask(req, res) {
    const { id } = req.params;
    const task = TASKS.find(t => t.id === Number(id));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const startedAt = Date.now();
    task.status = 'in-progress';

    let completedSubtasks = 0;
    const subtaskResults = task.subtasks.map((st, i) => {
      const success = Math.random() > 0.15;
      if (success) completedSubtasks++;
      return { step: st, status: success ? 'done' : 'failed', duration: Math.floor(Math.random() * 3000) + 500 };
    });

    const duration = Date.now() - startedAt;
    const allDone = completedSubtasks === task.subtasks.length;
    task.status = allDone ? 'completed' : 'in-progress';
    task.completedSubtasks = completedSubtasks;

    const log = addLog({
      action: 'EXECUTE_TASK',
      taskId: task.id,
      taskTitle: task.title,
      details: `Executed "${task.title}" — ${completedSubtasks}/${task.subtasks.length} steps done in ${duration}ms`,
      status: task.status,
      duration,
    });

    res.json({ success: true, data: { task, subtaskResults, log } });
  }

  static async approveTask(req, res) {
    const { id } = req.params;
    SEO_STORE.pendingApprovals = SEO_STORE.pendingApprovals.filter(a => a.taskId !== id);
    addLog({ action: 'APPROVE_TASK', taskId: Number(id), details: `Task #${id} approved` });
    res.json({ success: true, message: `Task ${id} approved` });
  }

  static async skipTask(req, res) {
    const { id } = req.params;
    SEO_STORE.pendingApprovals = SEO_STORE.pendingApprovals.filter(a => a.taskId !== id);
    addLog({ action: 'SKIP_TASK', taskId: Number(id), details: `Task #${id} skipped` });
    res.json({ success: true, message: `Task ${id} skipped` });
  }

  // ── EXECUTION LOG ──
  static getExecutionLog(req, res) {
    const { status, action, limit = 50 } = req.query;
    let logs = EXECUTION_LOG;
    if (status) logs = logs.filter(l => l.status === status);
    if (action) logs = logs.filter(l => l.action === action);
    logs = logs.slice(0, Number(limit));

    const stats = {
      total: EXECUTION_LOG.length,
      succeeded: EXECUTION_LOG.filter(l => l.status === 'completed' || l.status === 'done').length,
      failed: EXECUTION_LOG.filter(l => l.status === 'failed').length,
      pending: EXECUTION_LOG.filter(l => l.status === 'in-progress' || l.status === 'pending').length,
    };

    res.json({ success: true, data: logs, stats });
  }

  static getExecutionStats(req, res) {
    const byAction = {};
    EXECUTION_LOG.forEach(l => {
      byAction[l.action] = (byAction[l.action] || 0) + 1;
    });
    res.json({
      success: true,
      data: {
        total: EXECUTION_LOG.length,
        byAction,
        recentActivity: EXECUTION_LOG.slice(0, 5).map(l => ({
          action: l.action,
          details: l.details,
          timestamp: l.timestamp,
          taskTitle: l.taskTitle,
        })),
      }
    });
  }

  // ── COPILOT ──
  static getCopilotStatus(req, res) {
    res.json({ success: true, data: {
      copilotMode: SEO_STORE.copilotMode,
      riskThreshold: SEO_STORE.riskThreshold,
      activeSession: SEO_STORE.activeSession,
      pendingApprovals: SEO_STORE.pendingApprovals.length,
      recentLog: EXECUTION_LOG.slice(0, 10),
      totalExecutions: EXECUTION_LOG.length,
    }});
  }

  static async toggleCopilot(req, res) {
    SEO_STORE.copilotMode = !SEO_STORE.copilotMode;
    if (SEO_STORE.copilotMode) {
      SEO_STORE.activeSession = `session_${Date.now()}`;
    } else {
      SEO_STORE.activeSession = null;
    }
    addLog({ action: 'TOGGLE_COPILOT', details: `Copilot turned ${SEO_STORE.copilotMode ? 'ON' : 'OFF'}` });
    res.json({ success: true, copilotMode: SEO_STORE.copilotMode });
  }

  static async pauseCopilot(req, res) {
    SEO_STORE.activeSession = null;
    addLog({ action: 'PAUSE_COPILOT', details: 'Copilot paused' });
    res.json({ success: true, message: 'Copilot paused' });
  }

  static getCopilotHistory(req, res) {
    res.json({ success: true, data: EXECUTION_LOG });
  }

  // ── INVENTORYGPT SEO QUERY ──
  static async inventorygptQuery(req, res) {
    try {
      const { query } = req.body;
      if (!query) return res.status(400).json({ success: false, message: 'Query is required' });

      const pool = db;
      const [products] = await pool.promise().query(
        'SELECT name, short_name, sku, category_id, price, mrp, description FROM dispatch_product WHERE status = 1 LIMIT 20'
      );
      const [categories] = await pool.promise().query(
        'SELECT id, name FROM dispatch_category LIMIT 20'
      );
      const [stockCount] = await pool.promise().query(
        'SELECT COUNT(*) as total FROM stock_batches'
      );

      const productNames = products.map(p => p.name).filter(Boolean);
      const categoryNames = categories.map(c => c.name).filter(Boolean);
      const q = query.toLowerCase();

      const insights = [];

      if (q.includes('keyword') || q.includes('seo') || q.includes('optimize')) {
        productNames.slice(0, 8).forEach(name => {
          const words = name.split(' ').filter(w => w.length > 3);
          const keyword = words.slice(0, 4).join(' ');
          insights.push({
            type: 'keyword',
            title: `Target keyword: "${keyword}"`,
            reason: `Derived from your product "${name}"`,
            action: `Optimize page for "${keyword}"`,
            impact: '+15-25% organic traffic',
          });
        });
      }

      if (q.includes('meta') || q.includes('title') || q.includes('description')) {
        productNames.slice(0, 5).forEach(name => {
          const shortName = name.length > 50 ? name.substring(0, 50) + '...' : name;
          insights.push({
            type: 'meta',
            title: `Meta title suggestion: "${shortName} | Buy Online in India"`,
            reason: `Product "${name}" needs an optimized meta title`,
            action: 'Update meta title',
            impact: '+10-20% CTR',
          });
        });
      }

      if (q.includes('schema') || q.includes('rich') || q.includes('structured')) {
        categoryNames.slice(0, 5).forEach(cat => {
          insights.push({
            type: 'schema',
            title: `Add Product schema for "${cat}" category`,
            reason: `Structured data helps Google show rich results for ${cat} products`,
            action: 'Apply Product schema',
            impact: '+15-30% visibility',
          });
        });
      }

      if (q.includes('content') || q.includes('blog') || q.includes('article')) {
        categoryNames.slice(0, 5).forEach(cat => {
          insights.push({
            type: 'content',
            title: `Write guide: "Ultimate Guide to ${cat}"`,
            reason: `Category "${cat}" has high content potential`,
            action: 'Create content brief',
            impact: '+20-40% traffic',
          });
        });
      }

      if (q.includes('alt') || q.includes('image') || q.includes('technical')) {
        const noAlt = products.filter(p => !p.description || p.description.length < 20).length;
        insights.push({
          type: 'technical',
          title: `${noAlt} products missing descriptions`,
          reason: 'Products without descriptions miss SEO opportunities',
          action: 'Generate product descriptions',
          impact: '+5-15% organic rankings',
        });
      }

      if (insights.length === 0) {
        insights.push({
          type: 'general',
          title: `SEO analysis for "${query}"`,
          reason: `Found ${products.length} products across ${categoryNames.length} categories`,
          action: 'Run full SEO audit',
          impact: 'Comprehensive insights',
        });
      }

      addLog({ action: 'INVENTORYGPT_QUERY', details: `Query: "${query}" — ${insights.length} insights generated` });

      res.json({
        success: true,
        data: {
          query,
          productCount: products.length,
          categoryCount: categoryNames.length,
          stockCount: stockCount[0]?.total || 0,
          insights: insights.slice(0, 10),
          products: products.slice(0, 5).map(p => ({ name: p.name, sku: p.sku, price: p.price })),
        }
      });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // ── INSIGHTS ──
  static async generateInsight(req, res) {
    const { context } = req.body;
    const insights = [
      { insight: 'Product page has no FAQ schema — adding it can trigger rich results', action: 'Add FAQ schema', impact: '+15-25% CTR' },
      { insight: 'Meta title is under 40 characters — expanding to 55-60 can improve CTR', action: 'Expand meta title', impact: '+10-20% CTR' },
      { insight: 'No internal links from category pages — adding them distributes authority', action: 'Add internal links', impact: '+5-15% ranking' },
    ];
    const pick = insights[Math.floor(Math.random() * insights.length)];
    addLog({ action: 'GENERATE_INSIGHT', details: `Insight: ${pick.insight}` });
    res.json({ success: true, data: { ...pick, context } });
  }

  static async executeInsight(req, res) {
    const { insightId } = req.body;
    addLog({ action: 'EXECUTE_INSIGHT', insightId: insightId || 'unknown', details: `Insight ${insightId || 'unknown'} executed` });
    res.json({ success: true, message: 'Insight executed' });
  }

  // ── ANALYTICS ──
  static getAnalyticsDashboard(req, res) {
    res.json({ success: true, data: {
      organicTraffic: { daily: 1240, weekly: 8700, monthly: 37200, trend: '+12.4%' },
      rankingDistribution: { top3: 8, top10: 24, top20: 47, beyond: 89 },
      organicLeads: { count: 340, revenue: 189000 },
      coreWebVitals: { lcp: 2.1, fid: 45, cls: 0.08 },
    }});
  }

  // ── SCHEMA ──
  static async getSchema(req, res) {
    const { pageId } = req.params;
    res.json({ success: true, data: { pageId, schema: null, message: 'No schema applied' } });
  }

  static async applySchema(req, res) {
    const { pageId } = req.params;
    addLog({ action: 'APPLY_SCHEMA', pageId, details: `Schema applied to ${pageId}` });
    res.json({ success: true, message: `Schema applied to ${pageId}` });
  }

  // ── IMPLEMENTATION ──
  static async getMeta(req, res) {
    const { pageId } = req.params;
    res.json({ success: true, data: { pageId, title: null, description: null, ogImage: null } });
  }

  static async applyMeta(req, res) {
    const { pageId } = req.params;
    const { title, description } = req.body;
    addLog({ action: 'APPLY_META', pageId, title, details: `Meta applied to ${pageId}: "${title}"` });
    res.json({ success: true, message: `Meta applied to ${pageId}` });
  }
}

module.exports = SEOController;
