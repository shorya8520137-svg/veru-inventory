const express = require('express');
const router = express.Router();
const controller = require('../controllers/leadIntelligenceController');

router.get('/dashboard', (req, res) => controller.getDashboard(req, res));
router.get('/leads', (req, res) => controller.getLeads(req, res));
router.get('/leads/:conversationId', (req, res) => controller.getLeadDetail(req, res));
router.post('/analyze', (req, res) => controller.triggerAnalysis(req, res));

module.exports = router;
