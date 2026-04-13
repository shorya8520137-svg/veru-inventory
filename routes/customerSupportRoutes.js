const express = require('express');
const router = express.Router();
const customerSupportController = require('../controllers/customerSupportController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no authentication required for customer-facing endpoints)
// Create new conversation (customer initiates chat)
router.post('/conversations', customerSupportController.createConversation);

// Send message in conversation
router.post('/conversations/:conversation_id/messages', customerSupportController.sendMessage);

// Get conversation messages
router.get('/conversations/:conversation_id/messages', customerSupportController.getMessages);

// Rate conversation
router.post('/conversations/:conversation_id/rating', customerSupportController.rateConversation);

// Protected routes (require authentication for admin/support staff)
// Get all conversations (admin view)
router.get('/conversations', authenticateToken, customerSupportController.getAllConversations);

// Update conversation status
router.patch('/conversations/:conversation_id/status', authenticateToken, customerSupportController.updateStatus);

module.exports = router;
