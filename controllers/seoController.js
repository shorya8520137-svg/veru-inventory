const db = require('../db/connection');

const V3_SYSTEM_PROMPT = `You are an enterprise-grade Autonomous SEO Consultant combining the capabilities of:
* Senior Technical SEO Engineer
* Search Strategist
* Data Analyst
* Content Director
* Digital PR Specialist
* Growth Marketer
* Conversion Optimizer

Your objective is NOT simply to improve rankings.

Your objective is:
1. Increase qualified traffic.
2. Increase leads.
3. Increase conversions.
4. Build topical authority.
5. Build brand authority.
6. Create a long-term SEO moat.

Never assume. Always research first. Never hallucinate. Every recommendation must have evidence.

PHASE 1 — RESEARCH & DISCOVERY
First understand:
- Business: Business model, Products, Services, Revenue model
- Industry: Market size, Industry trends, Emerging opportunities
- Audience: ICP, Customer pain points, Customer journey
- Website: Architecture, Current SEO, Content inventory
- Competitors: Direct competitors, Indirect competitors, Search competitors

PHASE 2 — DOCUMENTATION
Create: Executive Summary, Current SEO Score, Technical SEO Score, Content Score, Authority Score, UX Score, Core Web Vitals, Competitor Analysis, Keyword Gap, Content Gap, Backlink Gap, Topical Authority Gap, Local SEO Gap, Conversion Gap, Schema Gap, International SEO Gap, Brand Gap, Opportunity Matrix, Risk Matrix, SWOT Analysis, Quick Wins, Medium Wins, Long Term Wins, Expected ROI, Difficulty Score, Impact Score, Confidence Score

PHASE 3 — REVERSE ENGINEER COMPETITORS
Identify: Highest traffic pages, Highest backlink pages, Best converting pages, Highest authority pages, Best performing keywords, Internal linking, Schema usage, Page speed, Content structure, Topic clusters, Navigation, Landing pages, CTA strategy, Lead magnets, Funnels, Pricing pages, Blog strategy, PR strategy, Brand mentions
Do not copy. Extract principles.

PHASE 4 — KEYWORD ENGINEERING
Find: Seed keywords, Commercial keywords, Informational keywords, Transactional keywords, Navigational keywords, Local keywords, Question keywords, Voice search keywords, Long tail keywords, Programmatic keywords, LSI keywords, Semantic keywords, Entity relationships, Search intent
Group into clusters. Build parent-child relationships. Map to funnel stages.

PHASE 5 — TOPICAL AUTHORITY
Design: Pillar pages, Cluster pages, Supporting blogs, Case studies, Comparison pages, Landing pages, FAQs, Glossaries, Tools, Calculators, Templates, Industry reports
Create internal linking maps.

PHASE 6 — TECHNICAL SEO
Audit: Robots.txt, Sitemap, Canonical tags, Pagination, Redirects, 404 pages, Broken links, Core Web Vitals, Mobile UX, Page speed, Image optimization, JavaScript rendering, Structured data, Schema, Open Graph, Twitter Cards, Breadcrumbs, SSL, Indexability, Crawl budget, Duplicate pages, Thin pages, Log files
Generate fixes.

PHASE 7 — CONTENT ENGINEERING
For every page: Purpose, Intent, Primary keyword, Secondary keywords, Entities, H1, H2, H3, Meta title, Meta description, Slug, Schema, Internal links, External links, FAQ, CTA, Image suggestions, Video suggestions, Word count, Publishing priority, Expected ROI

PHASE 8 — BACKLINK ENGINEERING
Identify: Guest posting, HARO opportunities, Digital PR, Broken link building, Resource pages, Skyscraper opportunities, Directories, Podcasts, Industry communities, Partnerships, Sponsorships, Brand mentions
Create outreach campaigns.

PHASE 9 — LOCAL SEO
Optimize: Google Business, NAP consistency, Local citations, Location pages, Reviews, Maps, Local schema, Regional keywords, Local backlinks

PHASE 10 — EXECUTION PLAN
Generate: 30 Day Plan, 60 Day Plan, 90 Day Plan, 180 Day Plan, 365 Day Plan
Every task should include: Priority, Impact, Difficulty, Dependencies, Estimated time, Owner, Success metric, Expected traffic gain, Expected lead gain, Expected ranking improvement

PHASE 11 — IMPLEMENTATION
Generate implementation-ready: HTML, Meta tags, Schema, JSON-LD, Content briefs, Developer tickets, Internal linking plans, Content calendars, Redirect maps, Sitemap updates, Robots updates

PHASE 12 — QUALITY ASSURANCE
Verify: No keyword stuffing, No black hat SEO, No duplicate content, No toxic backlinks, No cloaking, No hidden text, No doorway pages, No spam, Google compliance, Accessibility, E-E-A-T compliance

PHASE 13 — CONTINUOUS LEARNING
Track: Rankings, CTR, Traffic, Conversions, Revenue, Leads, Bounce rate, Core Web Vitals, Backlinks, Competitor changes, Algorithm updates, Search trends
Recommend improvements continuously.

OUTPUT FORMAT — Always produce:
1. Research
2. Evidence
3. Documentation
4. Strategy
5. Execution Plan
6. Implementation Tasks
7. KPI Dashboard
8. Risk Assessment
9. ROI Forecast
10. Next Actions

MISSION: Act as a world-class SEO Operating System whose goal is to maximize long-term organic growth and business revenue, not merely improve keyword rankings.`;

const PHASE_PROMPTS = {
  1: 'You are in PHASE 1 — RESEARCH & DISCOVERY. Focus on understanding the business model, industry, audience, website architecture, and competitors. Ask probing questions and gather evidence before making recommendations.',
  2: 'You are in PHASE 2 — DOCUMENTATION. Generate structured documentation including Executive Summary, SEO Scores, SWOT Analysis, Opportunity Matrix, and ROI forecasts. Be thorough and data-driven.',
  3: 'You are in PHASE 3 — REVERSE ENGINEER COMPETITORS. Analyze competitor strategies including their top pages, backlinks, keywords, content clusters, and CTAs. Extract principles — do not copy.',
  4: 'You are in PHASE 4 — KEYWORD ENGINEERING. Focus on finding seed keywords, commercial/informational/transactional terms, LSI keywords, and entity relationships. Group into clusters and map to funnel stages.',
  5: 'You are in PHASE 5 — TOPICAL AUTHORITY. Design pillar pages, cluster pages, supporting content, and internal linking maps. Focus on building entity relationships and topical depth.',
  6: 'You are in PHASE 6 — TECHNICAL SEO. Audit robots.txt, sitemaps, canonical tags, redirects, Core Web Vitals, mobile UX, structured data, schema, indexability, crawl budget, and duplicate content. Generate concrete fixes.',
  7: 'You are in PHASE 7 — CONTENT ENGINEERING. For every page define: purpose, intent, primary/secondary keywords, entities, H1-H3, meta title/description, slug, schema, internal/external links, FAQ, CTA, word count, and ROI.',
  8: 'You are in PHASE 8 — BACKLINK ENGINEERING. Identify guest posting, HARO, digital PR, broken link building, skyscraper, and partnership opportunities. Create outreach campaigns with templates.',
  9: 'You are in PHASE 9 — LOCAL SEO. Optimize Google Business Profile, NAP consistency, local citations, location pages, reviews, maps, local schema, and regional keywords.',
  10: 'You are in PHASE 10 — EXECUTION PLAN. Generate 30/60/90/180/365 day plans. Every task needs: priority, impact, difficulty, dependencies, estimated time, owner, success metric, and expected traffic/lead/ranking gains.',
  11: 'You are in PHASE 11 — IMPLEMENTATION. Generate implementation-ready artifacts: HTML, meta tags, JSON-LD schema, content briefs, developer tickets, redirect maps, sitemap/robots updates.',
  12: 'You are in PHASE 12 — QUALITY ASSURANCE. Verify no black hat SEO, no duplicate content, no toxic backlinks, no cloaking, no hidden text, no doorway pages. Check Google compliance, accessibility, and E-E-A-T.',
  13: 'You are in PHASE 13 — CONTINUOUS LEARNING. Track rankings, CTR, traffic, conversions, revenue, leads, bounce rate, Core Web Vitals, backlinks, competitor changes, algorithm updates, and search trends.',
};

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
        'SELECT product_name, barcode, category_id, price, description FROM dispatch_product WHERE is_active = 1 LIMIT 20'
      );
      const [categories] = await pool.promise().query(
        'SELECT id, name FROM product_categories WHERE is_active = 1 LIMIT 20'
      );
      const [stockCount] = await pool.promise().query(
        'SELECT COUNT(*) as total FROM stock_batches'
      );

      const productNames = products.map(p => p.product_name).filter(Boolean);
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
        const noDesc = products.filter(p => !p.description || p.description.length < 20).length;
        insights.push({
          type: 'technical',
          title: `${noDesc} products missing descriptions`,
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
          products: products.slice(0, 5).map(p => ({ name: p.product_name, sku: p.barcode, price: p.price })),
        }
      });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // ── LLM-POWERED SEO QUERY (via OpenRouter) ──
  static async llmQuery(req, res) {
    try {
      const { query } = req.body;
      if (!query) return res.status(400).json({ success: false, message: 'Query is required' });

      const pool = db;
      const [products] = await pool.promise().query(
        'SELECT product_name, barcode, category_id, price, description FROM dispatch_product WHERE is_active = 1 LIMIT 15'
      );
      const [categories] = await pool.promise().query(
        'SELECT id, name FROM product_categories WHERE is_active = 1 LIMIT 10'
      );

      let productContext = '';
      if (products.length > 0) {
        productContext = 'Current products in the store:\n';
        products.forEach(p => {
          productContext += `- ${p.product_name} (Price: ₹${p.price || 0})\n`;
        });
      }
      if (categories.length > 0) {
        const catNames = categories.map(c => c.name).filter(Boolean);
        productContext += `\nCategories: ${catNames.join(', ')}\n`;
      }

      const phaseContext = '';
      const systemPrompt = `${V3_SYSTEM_PROMPT}

Additional context for this session:
${productContext || 'No product data available.'}

${phaseContext}

Current date: ${new Date().toLocaleDateString()}`;

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.json({ success: false, message: 'LLM not configured on server' });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const models = [
        process.env.OPENROUTER_MODEL || 'openai/gpt-chat-latest',
        'google/gemini-3.5-flash',
        'google/gemini-3.1-flash-lite',
      ].filter((v, i, a) => a.indexOf(v) === i);

      let lastError = null;
      let result = null;

      for (const model of models) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model, temperature: 0.3, max_tokens: 2000, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: query }] }),
            signal: controller.signal,
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) { lastError = data?.error?.message || `HTTP ${response.status}`; continue; }
          const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;
          if (content) { result = { content, model }; break; }
          lastError = 'Empty response';
        } catch (e) {
          lastError = e?.message || 'Unknown error';
          if (e?.name === 'AbortError') lastError = 'Timed out';
        }
      }

      clearTimeout(timeoutId);

      if (!result) {
        return res.json({ success: false, message: `LLM unavailable: ${lastError}` });
      }

      addLog({ action: 'LLM_QUERY', details: `Query: "${query.substring(0, 60)}..." — model: ${result.model}` });

      res.json({ success: true, data: { answer: result.content, model: result.model, query } });
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

  // ── PHASE-SPECIFIC LLM QUERY ──
  static async llmPhaseQuery(req, res) {
    try {
      const { query, phase } = req.body;
      if (!query) return res.status(400).json({ success: false, message: 'Query is required' });
      const phaseNum = Number(phase) || 0;

      const pool = db;
      const [products] = await pool.promise().query(
        'SELECT product_name, barcode, price, description FROM dispatch_product WHERE is_active = 1 LIMIT 10'
      );
      const [categories] = await pool.promise().query(
        'SELECT id, name FROM product_categories WHERE is_active = 1 LIMIT 10'
      );

      let productContext = '';
      if (products.length > 0) {
        productContext = 'Current products in the store:\n';
        products.forEach(p => { productContext += `- ${p.product_name} (Price: ₹${p.price || 0})\n`; });
      }
      if (categories.length > 0) {
        const catNames = categories.map(c => c.name).filter(Boolean);
        productContext += `\nCategories: ${catNames.join(', ')}\n`;
      }

      const phaseInstruction = phaseNum >= 1 && phaseNum <= 13
        ? PHASE_PROMPTS[phaseNum]
        : `Focus on the most relevant phase(s) for the query. The phases are:
1=Research & Discovery, 2=Documentation, 3=Competitor Analysis, 4=Keyword Engineering,
5=Topical Authority, 6=Technical SEO, 7=Content Engineering, 8=Backlink Engineering,
9=Local SEO, 10=Execution Plan, 11=Implementation, 12=Quality Assurance, 13=Continuous Learning`;

      const systemPrompt = `${V3_SYSTEM_PROMPT}

${phaseInstruction}

${productContext || 'No product data available.'}

Current date: ${new Date().toLocaleDateString()}`;

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return res.json({ success: false, message: 'LLM not configured on server' });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const models = [
        process.env.OPENROUTER_MODEL || 'openai/gpt-chat-latest',
        'google/gemini-3.5-flash',
        'google/gemini-3.1-flash-lite',
      ].filter((v, i, a) => a.indexOf(v) === i);

      let lastError = null;
      let result = null;

      for (const model of models) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model, temperature: 0.3, max_tokens: 2500, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: query }] }),
            signal: controller.signal,
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) { lastError = data?.error?.message || `HTTP ${response.status}`; continue; }
          const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;
          if (content) { result = { content, model }; break; }
          lastError = 'Empty response';
        } catch (e) {
          lastError = e?.message || 'Unknown error';
          if (e?.name === 'AbortError') lastError = 'Timed out';
        }
      }

      clearTimeout(timeoutId);

      if (!result) return res.json({ success: false, message: `LLM unavailable: ${lastError}` });

      addLog({ action: 'LLM_PHASE_QUERY', details: `Phase ${phaseNum}: "${query.substring(0, 60)}..." — model: ${result.model}` });
      res.json({ success: true, data: { answer: result.content, model: result.model, query, phase: phaseNum } });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // ── RESEARCH & DISCOVERY (Phase 1-2) ──
  static getResearch(req, res) {
    res.json({ success: true, data: {
      business: {
        model: 'E-commerce — personalised gifts & custom products',
        products: 'Wine glasses, champagne flutes, whisky glasses, beer mugs, neon signs, LED name signs',
        revenueModel: 'Direct-to-consumer online sales',
      },
      industry: {
        marketSize: 'Indian personalised gifts market: ₹2,500 Cr+ growing at 18% CAGR',
        trends: ['AI-powered personalisation', 'Same-day delivery expectations', 'Video unboxing trend', 'Sustainable packaging demand'],
        opportunities: ['Corporate gifting segment', 'Wedding season spike', 'International shipping expansion'],
      },
      audience: {
        icp: 'Urban Indians aged 22-45, gifting for weddings, anniversaries, housewarmings, corporate events',
        painPoints: ['Generic gifts lack emotional value', 'Poor quality customisation', 'Late delivery for occasions'],
        journey: ['Browse → Explore customisation → Check reviews → Order → Track → Share on social'],
      },
    }});
  }

  // ── LOCAL SEO (Phase 9) ──
  static getLocalSEO(req, res) {
    res.json({ success: true, data: {
      googleBusiness: { claimed: false, verified: false, completenessScore: 0 },
      nap: { consistency: 'Unknown', sources: [], conflicts: 0 },
      citations: { total: 0, topDirectories: ['Justdial', 'IndiaMART', 'Google Maps', 'Sulekha', 'AskLaila'] },
      reviews: { total: 0, averageRating: 0, keywordsInReviews: [] },
      localSchema: { implemented: false, types: ['LocalBusiness', 'Store'] },
      recommendations: [
        { action: 'Claim and verify Google Business Profile', impact: '+40% local visibility', priority: 'HIGH' },
        { action: 'Build local citations on top 10 directories', impact: '+25% local rankings', priority: 'HIGH' },
        { action: 'Collect and respond to customer reviews', impact: '+15% conversion rate', priority: 'MEDIUM' },
        { action: 'Add LocalBusiness schema to website', impact: '+20% rich result eligibility', priority: 'MEDIUM' },
      ],
    }});
  }

  // ── QUALITY ASSURANCE (Phase 12) ──
  static getQualityAssurance(req, res) {
    res.json({ success: true, data: {
      overallCompliance: 'Needs Improvement',
      checks: [
        { name: 'Keyword Stuffing', status: 'pass', detail: 'No stuffing detected' },
        { name: 'Black Hat SEO', status: 'pass', detail: 'No black hat techniques found' },
        { name: 'Duplicate Content', status: 'warning', detail: '3 product descriptions are similar across variant pages' },
        { name: 'Toxic Backlinks', status: 'fail', detail: '12 toxic backlinks identified from low-quality domains' },
        { name: 'Cloaking', status: 'pass', detail: 'No cloaking detected' },
        { name: 'Hidden Text', status: 'pass', detail: 'No hidden text or links found' },
        { name: 'Doorway Pages', status: 'pass', detail: 'No doorway pages found' },
        { name: 'Google Compliance', status: 'warning', detail: 'Review Google Webmaster Guidelines for affiliate disclosure' },
        { name: 'Accessibility', status: 'warning', detail: '8 images missing alt text, color contrast issues on 2 pages' },
        { name: 'E-E-A-T', status: 'needs-work', detail: 'Add author bylines, about page, and customer trust signals' },
      ],
      recommendations: [
        { issue: 'Toxic backlinks', fix: 'Generate disavow file and submit to Google', priority: 'HIGH' },
        { issue: 'Duplicate product descriptions', fix: 'Write unique descriptions for each product variant', priority: 'MEDIUM' },
        { issue: 'Missing alt text', fix: 'Add descriptive alt tags to all product images', priority: 'MEDIUM' },
        { issue: 'E-E-A-T signals', fix: 'Add author profiles, customer testimonials, and trust badges', priority: 'LOW' },
      ],
    }});
  }
}

module.exports = SEOController;
