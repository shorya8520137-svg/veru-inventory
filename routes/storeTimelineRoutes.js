/**
 * Store Timeline Routes
 * 
 * API endpoints for querying store inventory timeline
 */

const express = require('express');
const router = express.Router();
const TimelineService = require('../services/TimelineService');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/store-timeline/:storeCode
 * Query timeline entries for a specific store
 */
router.get('/:storeCode', authenticateToken, async (req, res) => {
    try {
        const { storeCode } = req.params;
        const {
            dateFrom,
            dateTo,
            productBarcode,
            movementType,
            limit = 50,
            offset = 0
        } = req.query;
        
        // Build filters object
        const filters = {
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            productBarcode: productBarcode || null,
            movementType: movementType || null,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        
        // Query timeline
        const timeline = await TimelineService.queryTimeline(storeCode, filters);
        
        // Get total count for pagination
        const total = await TimelineService.getTimelineCount(storeCode, filters);
        
        res.json({
            success: true,
            data: {
                timeline,
                total,
                page: Math.floor(offset / limit) + 1,
                limit: parseInt(limit),
                hasMore: (offset + timeline.length) < total
            }
        });
        
    } catch (error) {
        console.error('Timeline query error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch timeline',
            error: error.message
        });
    }
});

/**
 * GET /api/store-timeline/:storeCode/balance/:productBarcode
 * Get current balance for a specific product at a store
 */
router.get('/:storeCode/balance/:productBarcode', authenticateToken, async (req, res) => {
    try {
        const { storeCode, productBarcode } = req.params;
        
        const balance = await TimelineService.getCurrentBalance(storeCode, productBarcode);
        
        res.json({
            success: true,
            data: {
                storeCode,
                productBarcode,
                currentBalance: balance
            }
        });
        
    } catch (error) {
        console.error('Balance query error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch balance',
            error: error.message
        });
    }
});

/**
 * POST /api/store-timeline/:storeCode/rebuild
 * Rebuild timeline from stock_batches (admin only)
 */
router.post('/:storeCode/rebuild', authenticateToken, async (req, res) => {
    try {
        const { storeCode } = req.params;
        
        // TODO: Add admin role check here
        // if (!req.user.isAdmin) {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Admin access required'
        //     });
        // }
        
        const entriesRebuilt = await TimelineService.rebuildTimeline(storeCode);
        
        res.json({
            success: true,
            message: `Timeline rebuilt successfully for ${storeCode}`,
            data: {
                entriesRebuilt
            }
        });
        
    } catch (error) {
        console.error('Timeline rebuild error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to rebuild timeline',
            error: error.message
        });
    }
});

module.exports = router;
