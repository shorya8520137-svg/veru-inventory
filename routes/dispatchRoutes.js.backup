const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// POST /api/dispatch - Create new dispatch
router.post('/', 
    authenticateToken, 
    checkPermission('operations.dispatch'), 
    dispatchController.createDispatch
);

// POST /api/dispatch/create - Create new dispatch (frontend form alias)
router.post('/create', 
    authenticateToken, 
    checkPermission('operations.dispatch'), 
    dispatchController.createDispatch
);

// GET /api/dispatch - Get all dispatches with filters
// Example: /api/dispatch?warehouse=GGM_WH&status=Pending&dateFrom=2025-01-01&dateTo=2025-12-31&search=product&page=1&limit=50
router.get('/', 
    authenticateToken, 
    checkPermission('orders.view'), 
    dispatchController.getDispatches
);

// PUT /api/dispatch/:id/status - Update dispatch status
router.put('/:id/status', 
    authenticateToken, 
    checkPermission('orders.status_update'), 
    dispatchController.updateDispatchStatus
);

// GET /api/dispatch/warehouses - Get warehouse list for dropdown
router.get('/warehouses', 
    authenticateToken, 
    dispatchController.getWarehouses
);

// GET /api/dispatch/logistics - Get logistics list for dropdown
router.get('/logistics', 
    authenticateToken, 
    dispatchController.getLogistics
);

// GET /api/dispatch/processed-persons - Get processed persons list for dropdown
router.get('/processed-persons', 
    authenticateToken, 
    dispatchController.getProcessedPersons
);

// GET /api/dispatch/payment-modes - Get payment modes list for dropdown
router.get('/payment-modes', 
    authenticateToken, 
    dispatchController.getPaymentModes
);

// GET /api/dispatch/search-products - Search products for dispatch
// Example: /api/dispatch/search-products?query=samsung
router.get('/search-products', 
    authenticateToken, 
    checkPermission('products.view'), 
    dispatchController.searchProducts
);

// GET /api/dispatch/check-inventory - Check inventory availability
// Example: /api/dispatch/check-inventory?warehouse=GGM_WH&barcode=ABC123&qty=2
router.get('/check-inventory', 
    authenticateToken, 
    checkPermission('inventory.view'), 
    dispatchController.checkInventory
);

// GET /api/dispatch/setup-products - Setup dispatch products table
router.get('/setup-products', 
    authenticateToken, 
    checkPermission('operations.dispatch'), 
    dispatchController.setupDispatchProducts
);

// POST /api/dispatch/damage-recovery - Handle damage/recovery operations
router.post('/damage-recovery', 
    authenticateToken, 
    checkPermission('operations.damage'), 
    dispatchController.handleDamageRecovery
);

// GET /api/dispatch/suggestions/products - Get product suggestions for dispatch (legacy support)
// Example: /api/dispatch/suggestions/products?search=samsung&warehouse=GGM_WH
router.get('/suggestions/products', 
    authenticateToken, 
    checkPermission('products.view'), 
    dispatchController.getProductSuggestions
);

// POST /api/dispatch/damage - Handle damage operations using damage controller
router.post('/damage', 
    authenticateToken, 
    checkPermission('operations.damage'), 
    (req, res) => {
        const damageRecoveryController = require('../controllers/damageRecoveryController');
        damageRecoveryController.reportDamage(req, res);
    }
);

// POST /api/dispatch/recover - Handle recovery operations using damage controller
router.post('/recover', 
    authenticateToken, 
    checkPermission('operations.damage'), 
    (req, res) => {
        const damageRecoveryController = require('../controllers/damageRecoveryController');
        damageRecoveryController.recoverStock(req, res);
    }
);

module.exports = router;
