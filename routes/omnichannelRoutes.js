const express = require('express');
const router = express.Router();
const omnichannelController = require('../controllers/omnichannelController');
const { authenticateToken } = require('../middleware/auth');

// Public endpoints (customer-facing)
router.post('/conversations/:conversation_id/messages', omnichannelController.sendMessage);

// Protected endpoints (agent-facing)
router.get('/conversations/:conversation_id/intelligence', authenticateToken, omnichannelController.getIntelligence);
router.get('/conversations/:conversation_id/timeline', authenticateToken, omnichannelController.getTimeline);
router.post('/conversations/:conversation_id/ai-takeover', authenticateToken, omnichannelController.aiTakeover);
router.post('/conversations/:conversation_id/generate-reply', authenticateToken, omnichannelController.generateReply);
router.get('/products/search', authenticateToken, omnichannelController.searchProduct);

module.exports = router;
