const db = require('../db/connection');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function callLLM(systemPrompt, userMessage, temperature = 0.3, maxTokens = 2000) {
  return new Promise(async (resolve) => {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return resolve(null);
      const models = [
        process.env.OPENROUTER_MODEL || 'openrouter/auto',
        'google/gemini-2.0-flash-001',
        'cohere/command-r-plus',
      ];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      let lastError = null;
      for (const model of models) {
        try {
          const res = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, temperature, max_tokens: maxTokens, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }] }),
            signal: controller.signal,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { lastError = data?.error?.message || `HTTP ${res.status}`; continue; }
          const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;
          if (content) { clearTimeout(timeoutId); return resolve(content); }
          lastError = 'Empty response';
        } catch (e) { lastError = e?.message || 'Unknown error'; }
      }
      clearTimeout(timeoutId);
      console.error('[LeadAnalysis] All models failed:', lastError);
      resolve(null);
    } catch (e) {
      console.error('[LeadAnalysis] Error:', e.message);
      resolve(null);
    }
  });
}

function parseJSON(text) {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) cleaned = match[1].trim();
  }
  try { return JSON.parse(cleaned); } catch { return null; }
}

class LeadAnalysisService {

  static async analyzeMessage(conversationId, message, customerData = {}) {
    try {
      const systemPrompt = `You are a Lead Intelligence AI for INSORA's e-commerce platform. Analyze the customer message and return JSON only (no markdown, no code fences). Return this exact structure:
{
  "intent": {"primary": "string", "secondary": ["string"], "confidence": 0-100},
  "sentiment": {"overall": "positive|neutral|negative|frustrated|urgent|confused", "score": 0-100, "urgency": 0-100},
  "buying_signals": {"signals": ["string"], "confidence": 0-100, "budget_estimate": "string|null", "timeline": "string|null"},
  "objections": [{"type": "string", "severity": "low|medium|high", "text": "string"}],
  "lead_score": {"score": 0-100, "tier": "hot|warm|cold|low_priority", "factors": ["string"]},
  "prediction": {"potential_value": "string", "close_probability": 0-100, "lifetime_value": "string"},
  "recommendation": {"action": "string", "priority": "high|medium|low", "reason": "string"}
}`;

      const userPrompt = `Customer: ${customerData.name || 'Unknown'}
Previous orders: ${customerData.order_count || 0}
Total spend: ${customerData.total_spend || 'N/A'}
Message: "${message}"

Analyze this customer interaction for lead intelligence. Consider buying intent, sentiment, urgency, and conversion probability.`;

      const raw = await callLLM(systemPrompt, userPrompt, 0.2, 1500);
      const analysis = parseJSON(raw);
      if (!analysis) {
        console.warn('[LeadAnalysis] Failed to parse LLM response for', conversationId);
        return null;
      }

      await this.saveAnalysis(conversationId, analysis, message);
      return analysis;
    } catch (e) {
      console.error('[LeadAnalysis] analyzeMessage error:', e.message);
      return null;
    }
  }

  static async saveAnalysis(conversationId, analysis, lastMessage) {
    try {
      const existing = await new Promise((resolve) => {
        db.query('SELECT id FROM lead_intelligence WHERE conversation_id = ?', [conversationId], (err, rows) => resolve(rows?.[0] || null));
      });

      const data = {
        lead_score: analysis.lead_score?.score || 0,
        lead_tier: analysis.lead_score?.tier || 'cold',
        intent: analysis.intent?.primary || 'unknown',
        sentiment: analysis.sentiment?.overall || 'neutral',
        sentiment_score: analysis.sentiment?.score || 50,
        urgency_score: analysis.sentiment?.urgency || 0,
        buying_confidence: analysis.buying_signals?.confidence || 0,
        budget_estimate: analysis.buying_signals?.budget_estimate || null,
        potential_value: analysis.prediction?.potential_value || null,
        close_probability: analysis.prediction?.close_probability || 0,
        lifetime_value: analysis.prediction?.lifetime_value || null,
        recommended_action: analysis.recommendation?.action || null,
        recommendation_priority: analysis.recommendation?.priority || 'low',
        last_analysis: JSON.stringify(analysis),
        last_message: lastMessage || '',
      };

      if (existing) {
        db.query(`UPDATE lead_intelligence SET ? WHERE conversation_id = ?`, [data, conversationId], () => {});
      } else {
        db.query(`INSERT INTO lead_intelligence SET ?, conversation_id = ?`, [data, conversationId], () => {});
      }
    } catch (e) {
      console.error('[LeadAnalysis] saveAnalysis error:', e.message);
    }
  }

  static async getDashboardStats() {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.query(`SELECT * FROM lead_intelligence`, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

      const convCount = await new Promise((resolve) => {
        db.query(`SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' OR status = 'in_progress' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'resolved' OR status = 'closed' THEN 1 ELSE 0 END) as closed
        FROM customer_support_conversations`, (err, rows) => resolve(rows?.[0] || { total: 0, active: 0, closed: 0 }));
      });

      const totalLeads = rows.length;
      const hotLeads = rows.filter(r => r.lead_tier === 'hot');
      const warmLeads = rows.filter(r => r.lead_tier === 'warm');
      const coldLeads = rows.filter(r => r.lead_tier === 'cold' || r.lead_tier === 'low_priority');
      const avgScore = totalLeads ? Math.round(rows.reduce((s, r) => s + (r.lead_score || 0), 0) / totalLeads) : 0;

      const potentialRevenue = rows.reduce((s, r) => {
        const val = parseFloat(r.potential_value?.replace(/[₹,]/g, '') || 0);
        const prob = (r.close_probability || 0) / 100;
        return s + (val * prob);
      }, 0);

      const intentCounts = {};
      rows.forEach(r => {
        const i = r.intent || 'unknown';
        intentCounts[i] = (intentCounts[i] || 0) + 1;
      });
      const topIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

      return {
        total_leads: totalLeads,
        hot_leads: hotLeads.length,
        warm_leads: warmLeads.length,
        cold_leads: coldLeads.length,
        ai_handled: 0,
        human_handled: convCount.active + convCount.closed,
        average_lead_score: avgScore,
        estimated_revenue: potentialRevenue,
        today_sales: 0,
        average_response_time: 0,
        sla_status: 'active',
        conversion_rate: convCount.total ? Math.round((convCount.closed / convCount.total) * 100) : 0,
        returning_customers: 0,
        vip_customers: 0,
        lost_lead_risk: coldLeads.length,
        lead_source_distribution: { omnichannel: totalLeads },
        top_intents: topIntent.map(([intent, count]) => ({ intent, count })),
      };
    } catch (e) {
      console.error('[LeadAnalysis] getDashboardStats error:', e.message);
      return this.getEmptyStats();
    }
  }

  static async getLeadDetail(conversationId) {
    try {
      const lead = await new Promise((resolve, reject) => {
        db.query(`SELECT li.*, csc.customer_name, csc.customer_email, csc.customer_phone, csc.subject, csc.status, csc.preferred_language, csc.created_at, csc.updated_at
          FROM lead_intelligence li
          JOIN customer_support_conversations csc ON li.conversation_id = csc.conversation_id
          WHERE li.conversation_id = ?`, [conversationId], (err, rows) => {
          if (err) return reject(err);
          resolve(rows?.[0] || null);
        });
      });
      if (!lead) return null;
      lead.analysis = lead.last_analysis ? JSON.parse(lead.last_analysis) : null;
      return lead;
    } catch (e) {
      console.error('[LeadAnalysis] getLeadDetail error:', e.message);
      return null;
    }
  }

  static async getAllLeads(filters = {}) {
    try {
      const { tier, intent, page = 1, limit = 50 } = filters;
      let where = [];
      let params = [];
      if (tier) { where.push('li.lead_tier = ?'); params.push(tier); }
      if (intent) { where.push('li.intent = ?'); params.push(intent); }
      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
      const offset = (page - 1) * limit;

      const rows = await new Promise((resolve, reject) => {
        db.query(`SELECT li.*, csc.customer_name, csc.customer_email, csc.status, csc.created_at as conv_created
          FROM lead_intelligence li
          JOIN customer_support_conversations csc ON li.conversation_id = csc.conversation_id
          ${whereClause}
          ORDER BY li.lead_score DESC
          LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)], (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

      const countRow = await new Promise((resolve, reject) => {
        db.query(`SELECT COUNT(*) as total FROM lead_intelligence li ${whereClause}`, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows?.[0] || { total: 0 });
        });
      });

      return { leads: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: countRow.total } };
    } catch (e) {
      console.error('[LeadAnalysis] getAllLeads error:', e.message);
      return { leads: [], pagination: { page: 1, limit, total: 0 } };
    }
  }

  static getEmptyStats() {
    return {
      total_leads: 0, hot_leads: 0, warm_leads: 0, cold_leads: 0,
      ai_handled: 0, human_handled: 0, average_lead_score: 0,
      estimated_revenue: 0, today_sales: 0, average_response_time: 0,
      sla_status: 'active', conversion_rate: 0, returning_customers: 0,
      vip_customers: 0, lost_lead_risk: 0, lead_source_distribution: {},
      top_intents: [],
    };
  }
}

module.exports = LeadAnalysisService;
