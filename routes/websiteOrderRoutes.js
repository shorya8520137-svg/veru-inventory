const express = require('express');
const router = express.Router();
const websiteOrderController = require('../controllers/websiteOrderController');
const { authenticateToken } = require('../middleware/auth');
const apiKeysController = require('../controllers/apiKeysController');

// Middleware to handle both JWT and API key authentication
const flexibleAuth = (req, res, next) => {
    // Check for API key first
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (apiKey && apiKey.startsWith('wk_live_')) {
        console.log('🔑 Using API key authentication for website order');
        return apiKeysController.validateApiKey(req, res, next);
    }
    
    // Fall back to JWT authentication
    console.log('🔒 Using JWT authentication for website order');
    return authenticateToken(req, res, next);
};

// All routes use flexible authentication (API key OR JWT)
router.post('/', flexibleAuth, websiteOrderController.createOrder);
router.get('/stats', flexibleAuth, websiteOrderController.getOrderStats);
router.get('/', flexibleAuth, websiteOrderController.getAllOrders);
router.get('/user', flexibleAuth, websiteOrderController.getUserOrders);
router.get('/:orderId', flexibleAuth, websiteOrderController.getOrderDetails);
router.put('/:orderId/status', flexibleAuth, websiteOrderController.updateOrderStatus);
router.put('/:orderId/cancel', flexibleAuth, websiteOrderController.cancelOrder);
router.get('/:orderId/tracking', flexibleAuth, websiteOrderController.trackOrder);

module.exports = router;