const express = require('express');
const router = express.Router();
const orderTrackingController = require('../controllers/orderTrackingController');
const { authenticateToken, checkPermission, checkWarehousePermission } = require('../middleware/auth');

/**
 * DISPATCH TRACKING ROUTES (Updated for Real Data with Permission Checks)
 * Uses warehouse_dispatch, warehouse_dispatch_items, damage_recovery_log
 */

// GET /api/order-tracking - Get all dispatches with tracking info
// Example: /api/order-tracking?warehouse=BLR_WH&status=Pending&page=1&limit=20
router.get('/', 
    authenticateToken, 
    checkWarehousePermission('ORDERS_VIEW'), 
    orderTrackingController.getAllDispatches
);

// GET /api/order-tracking/stats - Get dispatch statistics
// Example: /api/order-tracking/stats?warehouse=BLR_WH&dateFrom=2025-01-01
router.get('/stats', 
    authenticateToken, 
    checkWarehousePermission('ORDERS_VIEW'), 
    orderTrackingController.getDispatchStats
);

// GET /api/order-tracking/:dispatchId/timeline - Get complete timeline for specific dispatch
// Example: /api/order-tracking/17/timeline
router.get('/:dispatchId/timeline', 
    authenticateToken, 
    checkPermission('INVENTORY_TIMELINE'), 
    orderTrackingController.getDispatchTimeline
);

// POST /api/order-tracking/:dispatchId/damage - Report damage for dispatch items
// Body: { product_name, barcode, warehouse, quantity, reason, notes }
router.post('/:dispatchId/damage', 
    authenticateToken, 
    checkPermission('OPERATIONS_DAMAGE'), 
    orderTrackingController.reportDispatchDamage
);

// DELETE /api/order-tracking/:dispatchId - Delete dispatch and restore stock
// Example: DELETE /api/order-tracking/17
router.delete('/:dispatchId', 
    authenticateToken, 
    checkPermission('ORDERS_EDIT'), 
    orderTrackingController.deleteDispatch
);

// PATCH /api/order-tracking/:dispatchId/status - Update dispatch status
// Body: { status: 'Delivered' }
router.patch('/:dispatchId/status', 
    authenticateToken, 
    checkPermission('ORDERS_EDIT'), 
    orderTrackingController.updateDispatchStatus
);

// GET /api/order-tracking/export - Export dispatches as CSV
// Example: /api/order-tracking/export?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31
router.get('/export', 
    authenticateToken, 
    // Temporarily removed permission check: checkPermission('ORDERS_EXPORT'), 
    orderTrackingController.exportDispatches
);

module.exports = router;
