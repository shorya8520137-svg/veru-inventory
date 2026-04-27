const express = require('express');
const router = express.Router();
const returnsController = require('../controllers/returnsController.FIXED');
const { authenticateToken, checkPermission } = require('../middleware/auth');

/**
 * =====================================================
 * FIXED RETURNS ROUTES - Complete Timeline Integration
 * Supports both warehouse and store returns
 * =====================================================
 */

// POST /api/returns - Create new return with timeline integration
// Body: {
//   return_type: 'WAREHOUSE' | 'STORE',
//   source_location: 'warehouse_code' | 'store_code',
//   destination_location: 'warehouse_code' (optional),
//   order_ref: 'string',
//   awb: 'string',
//   product_type: 'string',
//   quantity: number,
//   barcode: 'string',
//   condition: 'good' | 'damaged' | 'defective',
//   return_reason: 'string',
//   original_dispatch_id: number (optional),
//   processed_by: number (user_id),
//   notes: 'string',
//   has_parts: boolean,
//   parts: [{ part_name, part_barcode, quantity, condition, notes }]
// }
router.post('/', authenticateToken, returnsController.createReturn);

// GET /api/returns - Get all returns with enhanced filtering
// Query params: return_type, source_location, destination_location, status, condition, dateFrom, dateTo, search, page, limit
router.get('/', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.getReturns);

// GET /api/returns/:returnId/timeline - Get complete timeline for a return
// Shows both warehouse and store timeline entries
router.get('/:returnId/timeline', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.getReturnTimeline);

// GET /api/returns/warehouses - Use dispatch warehouses endpoint
router.get('/warehouses', authenticateToken, checkPermission('OPERATIONS_RETURN'), (req, res) => {
    const dispatchController = require('../controllers/dispatchController');
    dispatchController.getWarehouses(req, res);
});

// GET /api/returns/search-products - Use dispatch search endpoint
router.get('/search-products', authenticateToken, checkPermission('OPERATIONS_RETURN'), (req, res) => {
    const dispatchController = require('../controllers/dispatchController');
    dispatchController.searchProducts(req, res);
});

// GET /api/returns/:id - Get return by ID
router.get('/:id', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.getReturnById || ((req, res) => {
    res.status(501).json({ success: false, message: 'getReturnById not implemented yet' });
}));

// POST /api/returns/bulk - Process bulk returns
router.post('/bulk', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.processBulkReturns || ((req, res) => {
    res.status(501).json({ success: false, message: 'processBulkReturns not implemented yet' });
}));

// GET /api/returns/suggestions/products - Get product suggestions for returns
router.get('/suggestions/products', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.getProductSuggestions || ((req, res) => {
    res.status(501).json({ success: false, message: 'getProductSuggestions not implemented yet' });
}));

// GET /api/returns/suggestions/warehouses - Get warehouse suggestions
router.get('/suggestions/warehouses', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.getWarehouses || ((req, res) => {
    res.status(501).json({ success: false, message: 'getWarehouses not implemented yet' });
}));

// DELETE /api/returns/clear-all - Clear all return data (for testing/cleanup)
// Body: { confirm: "YES_DELETE_ALL_RETURNS" }
router.delete('/clear-all', authenticateToken, checkPermission('ADMIN'), returnsController.clearAllReturnData);

module.exports = router;