const express = require('express');
const router = express.Router();
const returnsController = require('../controllers/returnsController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// POST /api/returns - Create new return (PERMISSION REMOVED FOR TESTING)
router.post('/', authenticateToken, /* checkPermission('OPERATIONS_RETURN'), */ returnsController.createReturn);

// GET /api/returns - Get all returns with filters
// Example: /api/returns?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31&search=product&page=1&limit=50
router.get('/', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.getReturns);

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
router.get('/:id', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.getReturnById);

// POST /api/returns/bulk - Process bulk returns
router.post('/bulk', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.processBulkReturns);

// GET /api/returns/suggestions/products - Get product suggestions for returns
// Example: /api/returns/suggestions/products?search=samsung
router.get('/suggestions/products', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.getProductSuggestions);

// GET /api/returns/suggestions/warehouses - Get warehouse suggestions
router.get('/suggestions/warehouses', authenticateToken, checkPermission('OPERATIONS_RETURN'), returnsController.getWarehouses);

module.exports = router;
