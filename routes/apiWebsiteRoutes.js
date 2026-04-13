const express = require('express');
const router = express.Router();
const websiteProductController = require('../controllers/websiteProductController');
const websiteOrderController = require('../controllers/websiteOrderController');
const apiKeysController = require('../controllers/apiKeysController');

// Helper middleware to conditionally apply authentication
const conditionalAuth = (req, res, next) => {
    // Allow GET requests without authentication (public access)
    if (req.method === 'GET') {
        return next();
    }
    
    // For POST/PUT/DELETE operations, check for JWT first, then API key
    const authHeader = req.headers['authorization'];
    const apiKey = req.headers['x-api-key'] || (authHeader && authHeader.startsWith('wk_live_') ? authHeader.replace('Bearer ', '') : null);
    const jwtToken = authHeader && authHeader.startsWith('Bearer ') && !authHeader.includes('wk_live_') ? authHeader.split(' ')[1] : null;
    
    // If JWT token is provided, use JWT authentication
    if (jwtToken) {
        console.log('🔐 Using JWT authentication for website route');
        const { authenticateToken } = require('../middleware/auth');
        return authenticateToken(req, res, next);
    }
    
    // If API key is provided, use API key authentication
    if (apiKey) {
        console.log('🔑 Using API key authentication for website route');
        return apiKeysController.validateApiKey(req, res, next);
    }
    
    // If neither is provided, return 401
    return res.status(401).json({
        success: false,
        message: 'Authentication required. Provide either JWT token or API key.'
    });
};

// Apply conditional authentication to all routes
router.use(conditionalAuth);

// Website Products API Routes (GET = public, others = JWT or API key required)
router.get('/products', websiteProductController.getProducts);
router.get('/products/featured', websiteProductController.getFeaturedProducts);
router.get('/products/:id', websiteProductController.getProduct);
router.post('/products', websiteProductController.createProduct);
router.put('/products/:id', websiteProductController.updateProduct);
router.delete('/products/:id', websiteProductController.deleteProduct);

// Website Categories API Routes (GET = public, others = JWT or API key required)
router.get('/categories', websiteProductController.getCategories);
router.post('/categories', websiteProductController.createCategory);
router.put('/categories/:id', websiteProductController.updateCategory);
router.delete('/categories/:id', websiteProductController.deleteCategory);

// Website Orders API Routes (GET = public, others = JWT or API key required)
router.get('/orders', websiteOrderController.getAllOrders);
router.get('/orders/stats', websiteOrderController.getOrderStats || ((req, res) => res.json({ success: true, data: { total_orders: 0, pending_orders: 0, completed_orders: 0, cancelled_orders: 0 } })));
router.get('/orders/user', websiteOrderController.getUserOrders);
router.get('/orders/:orderId', websiteOrderController.getOrderDetails);
router.post('/orders', websiteOrderController.createOrder);
router.put('/orders/:orderId/status', websiteOrderController.updateOrderStatus);
router.put('/orders/:orderId/cancel', websiteOrderController.cancelOrder);
router.get('/orders/:orderId/tracking', websiteOrderController.trackOrder);

module.exports = router;