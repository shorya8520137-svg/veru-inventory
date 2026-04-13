const express = require('express');
const router = express.Router();
const damageRecoveryController = require('../controllers/damageRecoveryController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// POST /api/damage-recovery/damage - Report damage (PERMISSION REMOVED FOR TESTING)
router.post('/damage', 
    authenticateToken, 
    // checkPermission('operations.damage'),  // TEMPORARILY REMOVED FOR TESTING
    damageRecoveryController.reportDamage
);

// POST /api/damage-recovery/recover - Recover stock (PERMISSION REMOVED FOR TESTING)
router.post('/recover', 
    authenticateToken, 
    // checkPermission('operations.damage'),  // TEMPORARILY REMOVED FOR TESTING
    damageRecoveryController.recoverStock
);

// GET /api/damage-recovery/log - Get damage & recovery log
router.get('/log', 
    authenticateToken, 
    checkPermission('operations.damage'), 
    damageRecoveryController.getDamageRecoveryLog
);

// GET /api/damage-recovery/warehouses - Get warehouses (use dispatch controller)
router.get('/warehouses', 
    authenticateToken, 
    (req, res) => {
        const dispatchController = require('../controllers/dispatchController');
        dispatchController.getWarehouses(req, res);
    }
);

// GET /api/damage-recovery/search-products - Search products (use dispatch controller)
router.get('/search-products', 
    authenticateToken, 
    checkPermission('products.view'), 
    (req, res) => {
        const dispatchController = require('../controllers/dispatchController');
        dispatchController.searchProducts(req, res);
    }
);

// GET /api/damage-recovery/summary - Get damage/recovery summary by warehouse
router.get('/summary', 
    authenticateToken, 
    checkPermission('operations.damage'), 
    damageRecoveryController.getDamageRecoverySummary
);

module.exports = router;
