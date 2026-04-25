const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const apiKeysController = require('../controllers/apiKeysController');

/**
 * TIMELINE ROUTES (With JWT and API Key Authentication)
 * Handles product timeline and inventory movement tracking
 * Supports both JWT tokens and API keys for authentication
 */

// Middleware to support both JWT and API Key authentication
const authenticateRequest = (req, res, next) => {
    console.log('🔍 authenticateRequest middleware called');
    console.log('Headers:', {
        'x-api-key': req.headers['x-api-key'] ? 'present' : 'missing',
        'authorization': req.headers['authorization'] ? 'present' : 'missing'
    });
    
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    
    // If API key is provided in X-API-Key header, use API key authentication
    if (apiKey) {
        console.log('🔑 Using API Key authentication');
        return apiKeysController.validateApiKey(req, res, next);
    }
    
    // If Authorization header is provided, check if it's an API key or JWT
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '').trim();
        
        // Check if it looks like an API key (starts with wk_live_)
        if (token.startsWith('wk_live_')) {
            console.log('🔑 Using API Key from Authorization header');
            req.headers['x-api-key'] = token;
            return apiKeysController.validateApiKey(req, res, next);
        }
        
        // Otherwise, treat as JWT token
        console.log('🎫 Using JWT authentication');
        return authenticateToken(req, res, next);
    }
    
    // No authentication provided
    console.log('❌ No authentication provided');
    return res.status(401).json({
        success: false,
        message: 'Authentication required. Provide either X-API-Key header or Authorization Bearer token'
    });
};

// GET /api/timeline/:productCode - Get timeline for specific product
// Example: /api/timeline/XYZ789?warehouse=BLR_WH&dateFrom=2025-01-01&dateTo=2025-01-31&limit=50
router.get('/:productCode', 
    authenticateRequest, 
    // checkPermission('inventory.timeline'), // TEMPORARILY REMOVED FOR TESTING
    timelineController.getProductTimeline
);

// GET /api/timeline - Get timeline summary (grouped by product or warehouse)
// Example: /api/timeline?warehouse=BLR_WH&groupBy=product&dateFrom=2025-01-01
router.get('/', 
    authenticateRequest, 
    // checkPermission('inventory.timeline'), // TEMPORARILY REMOVED FOR TESTING
    timelineController.getTimelineSummary
);

module.exports = router;
