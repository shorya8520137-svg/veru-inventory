const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { authenticateToken } = require('../middleware/auth');
const apiKeysController = require('../controllers/apiKeysController');

/**
 * TIMELINE ROUTES - Support both JWT and API Keys
 */

// GET /api/timeline/:productCode - Get timeline for specific product
router.get('/:productCode', 
    apiKeysController.validateApiKey,  // This will handle both API keys and JWT
    timelineController.getProductTimeline
);

// GET /api/timeline - Get timeline summary
router.get('/', 
    apiKeysController.validateApiKey,  // This will handle both API keys and JWT
    timelineController.getTimelineSummary
);

module.exports = router;
