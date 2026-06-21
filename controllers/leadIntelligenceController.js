const LeadAnalysisService = require('../services/LeadAnalysisService');

class LeadIntelligenceController {

  async getDashboard(req, res) {
    try {
      const stats = await LeadAnalysisService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  async getLeads(req, res) {
    try {
      const { tier, intent, page, limit } = req.query;
      const result = await LeadAnalysisService.getAllLeads({ tier, intent, page, limit });
      res.json({ success: true, data: result });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  async getLeadDetail(req, res) {
    try {
      const { conversationId } = req.params;
      const lead = await LeadAnalysisService.getLeadDetail(conversationId);
      if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
      res.json({ success: true, data: lead });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  async triggerAnalysis(req, res) {
    try {
      const { conversation_id, message } = req.body;
      if (!conversation_id || !message) {
        return res.status(400).json({ success: false, message: 'conversation_id and message required' });
      }
      const analysis = await LeadAnalysisService.analyzeMessage(conversation_id, message);
      res.json({ success: true, data: analysis });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}

module.exports = new LeadIntelligenceController();
