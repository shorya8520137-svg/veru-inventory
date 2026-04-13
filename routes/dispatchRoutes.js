const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// POST /api/dispatch - Create new dispatch
router.post('/', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.createDispatch);

// POST /api/dispatch/create - Create new dispatch (frontend form alias)
router.post('/create', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.createDispatch);

// GET /api/dispatch - Get all dispatches with filters
// Example: /api/dispatch?warehouse=GGM_WH&status=Pending&dateFrom=2025-01-01&dateTo=2025-12-31&search=product&page=1&limit=50
router.get('/', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.getDispatches);

// PUT /api/dispatch/:id/status - Update dispatch status
router.put('/:id/status', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.updateDispatchStatus);

// GET /api/dispatch/warehouses - Get warehouse list for dropdown
router.get('/warehouses', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.getWarehouses);

// GET /api/dispatch/logistics - Get logistics list for dropdown
router.get('/logistics', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.getLogistics);

// GET /api/dispatch/processed-persons - Get processed persons list for dropdown
router.get('/processed-persons', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.getProcessedPersons);

// GET /api/dispatch/payment-modes - Get payment modes list for dropdown
router.get('/payment-modes', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.getPaymentModes);

// GET /api/dispatch/search-products - Search products for dispatch
// Example: /api/dispatch/search-products?query=samsung
router.get('/search-products', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.searchProducts);

// GET /api/dispatch/check-inventory - Check inventory availability
// Example: /api/dispatch/check-inventory?warehouse=GGM_WH&barcode=ABC123&qty=2
router.get('/check-inventory', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.checkInventory);

// GET /api/dispatch/setup-products - Setup dispatch products table
router.get('/setup-products', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.setupDispatchProducts);

// POST /api/dispatch/damage-recovery - Handle damage/recovery operations
router.post('/damage-recovery', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.handleDamageRecovery);

// GET /api/dispatch/suggestions/products - Get product suggestions for dispatch (legacy support)
// Example: /api/dispatch/suggestions/products?search=samsung&warehouse=GGM_WH
router.get('/suggestions/products', authenticateToken, checkPermission('OPERATIONS_DISPATCH'), dispatchController.getProductSuggestions);

// POST /api/dispatch/damage - Handle damage operations using damage controller
router.post('/damage', 
    authenticateToken, 
    (req, res) => {
        const damageRecoveryController = require('../controllers/damageRecoveryController');
        damageRecoveryController.reportDamage(req, res);
    }
);

// POST /api/dispatch/recover - Handle recovery operations using damage controller
router.post('/recover', 
    authenticateToken, 
    (req, res) => {
        const damageRecoveryController = require('../controllers/damageRecoveryController');
        damageRecoveryController.recoverStock(req, res);
    }
);

module.exports = router;
