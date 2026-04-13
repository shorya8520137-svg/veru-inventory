const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// GET /api/inventory - Get inventory with filtering
// Example: /api/inventory?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31&search=product&stockFilter=in-stock&sortBy=product_name&sortOrder=asc&page=1&limit=50
router.get('/', 
    authenticateToken, 
    checkPermission('inventory.view'), 
    inventoryController.getInventory
);

// GET /api/inventory/by-warehouse - Get inventory by warehouse (legacy support)
router.get('/by-warehouse', 
    authenticateToken, 
    checkPermission('inventory.view'), 
    inventoryController.getInventoryByWarehouse
);

// GET /api/inventory/export - Export inventory as CSV
// Example: /api/inventory/export?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31&export=true
router.get('/export', 
    authenticateToken, 
    checkPermission('inventory.export'), 
    inventoryController.exportInventory
);

// POST /api/inventory/add-stock - Add stock to inventory
router.post('/add-stock', 
    authenticateToken, 
    checkPermission('inventory.adjust'), 
    inventoryController.addStock
);

// GET /api/inventory/timeline/:productCode - Get product timeline (redirect to timeline API)
router.get('/timeline/:productCode', 
    authenticateToken, 
    checkPermission('inventory.timeline'), 
    (req, res) => {
        const timelineController = require('../controllers/timelineController');
        timelineController.getProductTimeline(req, res);
    }
);

module.exports = router;
