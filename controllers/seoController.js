const db = require('../db/connection');

const SEO_STORE = {
  copilotMode: false,
  riskThreshold: 'low',
  activeSession: null,
  pendingApprovals: [],
  executionLog: [],
  auditState: null,
  activeInsights: [],
};

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
    const tasks = [
      { id: 1, title: 'Add FAQ schema to all product pages', priority: 'HIGH', impact: 85, difficulty: 'LOW', status: 'pending', phase: 30 },
      { id: 2, title: 'Optimize meta titles for top 10 products', priority: 'HIGH', impact: 70, difficulty: 'LOW', status: 'pending', phase: 30 },
      { id: 3, title: 'Fix missing alt tags on product images', priority: 'MEDIUM', impact: 45, difficulty: 'LOW', status: 'pending', phase: 30 },
      { id: 4, title: 'Create content cluster for personalised gifts', priority: 'MEDIUM', impact: 60, difficulty: 'MEDIUM', status: 'pending', phase: 60 },
      { id: 5, title: 'Build backlink outreach list', priority: 'HIGH', impact: 80, difficulty: 'HIGH', status: 'pending', phase: 60 },
      { id: 6, title: 'Implement breadcrumb schema', priority: 'MEDIUM', impact: 35, difficulty: 'LOW', status: 'completed', phase: 30 },
    ];
    res.json({ success: true, data: tasks });
  }

  static async approveTask(req, res) {
    const { id } = req.params;
    SEO_STORE.executionLog.push({ action: 'APPROVE_TASK', taskId: id, at: new Date().toISOString() });
    SEO_STORE.pendingApprovals = SEO_STORE.pendingApprovals.filter(a => a.taskId !== id);
    res.json({ success: true, message: `Task ${id} approved` });
  }

  static async skipTask(req, res) {
    const { id } = req.params;
    SEO_STORE.pendingApprovals = SEO_STORE.pendingApprovals.filter(a => a.taskId !== id);
    res.json({ success: true, message: `Task ${id} skipped` });
  }

  // ── COPILOT ──
  static getCopilotStatus(req, res) {
    res.json({ success: true, data: {
      copilotMode: SEO_STORE.copilotMode,
      riskThreshold: SEO_STORE.riskThreshold,
      activeSession: SEO_STORE.activeSession,
      pendingApprovals: SEO_STORE.pendingApprovals.length,
      recentLog: SEO_STORE.executionLog.slice(-10),
    }});
  }

  static async toggleCopilot(req, res) {
    SEO_STORE.copilotMode = !SEO_STORE.copilotMode;
    if (SEO_STORE.copilotMode) {
      SEO_STORE.activeSession = `session_${Date.now()}`;
    } else {
      SEO_STORE.activeSession = null;
    }
    res.json({ success: true, copilotMode: SEO_STORE.copilotMode });
  }

  static async pauseCopilot(req, res) {
    SEO_STORE.activeSession = null;
    res.json({ success: true, message: 'Copilot paused' });
  }

  static getCopilotHistory(req, res) {
    res.json({ success: true, data: SEO_STORE.executionLog });
  }

  // ── INSIGHTS (from InventoryGPT) ──
  static async generateInsight(req, res) {
    const { context } = req.body;
    const insights = [
      { insight: 'Product page has no FAQ schema — adding it can trigger rich results', action: 'Add FAQ schema', impact: '+15-25% CTR' },
      { insight: 'Meta title is under 40 characters — expanding to 55-60 can improve CTR', action: 'Expand meta title', impact: '+10-20% CTR' },
      { insight: 'No internal links from category pages — adding them distributes authority', action: 'Add internal links', impact: '+5-15% ranking' },
    ];
    const pick = insights[Math.floor(Math.random() * insights.length)];
    res.json({ success: true, data: { ...pick, context } });
  }

  static async executeInsight(req, res) {
    const { insightId } = req.body;
    SEO_STORE.executionLog.push({ action: 'EXECUTE_INSIGHT', insightId: insightId || 'unknown', at: new Date().toISOString() });
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
    SEO_STORE.executionLog.push({ action: 'APPLY_SCHEMA', pageId, at: new Date().toISOString() });
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
    SEO_STORE.executionLog.push({ action: 'APPLY_META', pageId, title, at: new Date().toISOString() });
    res.json({ success: true, message: `Meta applied to ${pageId}` });
  }
}

module.exports = SEOController;
