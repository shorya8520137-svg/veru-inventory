const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { authenticateToken } = require('../middleware/auth');

/**
 * TIMELINE ROUTES - Use JWT authentication for web interface
 */

// GET /api/timeline/:productCode - Get timeline for specific product
router.get('/:productCode', 
    authenticateToken,  // Use JWT for web interface
    timelineController.getProductTimeline
);

// GET /api/timeline - Get timeline summary
router.get('/', 
    authenticateToken,  // Use JWT for web interface
    timelineController.getTimelineSummary
);

module.exports = router;
