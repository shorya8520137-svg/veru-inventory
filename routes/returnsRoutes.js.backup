const express = require('express');
const router = express.Router();
const returnsController = require('../controllers/returnsController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// POST /api/returns - Create new return
router.post('/', 
    authenticateToken, 
    checkPermission('operations.return'), 
    returnsController.createReturn
);

// GET /api/returns - Get all returns with filters
// Example: /api/returns?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31&search=product&page=1&limit=50
router.get('/', 
    authenticateToken, 
    checkPermission('operations.return'), 
    returnsController.getReturns
);

// GET /api/returns/warehouses - Use dispatch warehouses endpoint
router.get('/warehouses', 
    authenticateToken, 
    (req, res) => {
        const dispatchController = require('../controllers/dispatchController');
        dispatchController.getWarehouses(req, res);
    }
);

// GET /api/returns/search-products - Use dispatch search endpoint
router.get('/search-products', 
    authenticateToken, 
    checkPermission('products.view'), 
    (req, res) => {
        const dispatchController = require('../controllers/dispatchController');
        dispatchController.searchProducts(req, res);
    }
);

// GET /api/returns/:id - Get return by ID
router.get('/:id', 
    authenticateToken, 
    checkPermission('operations.return'), 
    returnsController.getReturnById
);

// POST /api/returns/bulk - Process bulk returns
router.post('/bulk', 
    authenticateToken, 
    checkPermission('operations.bulk'), 
    returnsController.processBulkReturns
);

// GET /api/returns/suggestions/products - Get product suggestions for returns
// Example: /api/returns/suggestions/products?search=samsung
router.get('/suggestions/products', 
    authenticateToken, 
    checkPermission('products.view'), 
    returnsController.getProductSuggestions
);

// GET /api/returns/suggestions/warehouses - Get warehouse suggestions
router.get('/suggestions/warehouses', 
    authenticateToken, 
    returnsController.getWarehouses
);

module.exports = router;
