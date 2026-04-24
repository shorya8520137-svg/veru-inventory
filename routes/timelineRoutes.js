const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

/**
 * TIMELINE ROUTES (With Permission Checks)
 * Handles product timeline and inventory movement tracking
 */

// GET /api/timeline/:productCode - Get timeline for specific product
// Example: /api/timeline/XYZ789?warehouse=BLR_WH&dateFrom=2025-01-01&dateTo=2025-01-31&limit=50
router.get('/:productCode', 
    authenticateToken, 
    checkPermission('inventory.timeline'), 
    timelineController.getProductTimeline
);

// GET /api/timeline - Get timeline summary (grouped by product or warehouse)
// Example: /api/timeline?warehouse=BLR_WH&groupBy=product&dateFrom=2025-01-01
router.get('/', 
    authenticateToken, 
    checkPermission('inventory.timeline'), 
    timelineController.getTimelineSummary
);

module.exports = router;
