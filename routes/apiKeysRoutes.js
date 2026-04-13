const express = require('express');
const router = express.Router();
const apiKeysController = require('../controllers/apiKeysController');

// All routes require authentication
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/api-keys - Get all API keys for the authenticated user
router.get('/', apiKeysController.getApiKeys);

// POST /api/api-keys - Create a new API key
router.post('/', apiKeysController.createApiKey);

// PUT /api/api-keys/:id - Update an API key
router.put('/:id', apiKeysController.updateApiKey);

// DELETE /api/api-keys/:id - Delete an API key
router.delete('/:id', apiKeysController.deleteApiKey);

// GET /api/api-keys/usage - Get API usage statistics
router.get('/usage', apiKeysController.getApiUsage);

// GET /api/api-keys/analytics - Get detailed usage analytics
router.get('/analytics', apiKeysController.getUsageAnalytics);

module.exports = router;