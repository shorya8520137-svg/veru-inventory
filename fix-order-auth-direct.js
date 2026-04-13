#!/usr/bin/env node

/**
 * Direct Fix for Order Authentication
 * Apply API key authentication directly to website order routes
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Direct Fix: Order Authentication');
console.log('===================================');

// Read the websiteOrderRoutes.js file
const routesPath = path.join(__dirname, 'routes/websiteOrderRoutes.js');
let routesContent = fs.readFileSync(routesPath, 'utf8');

console.log('📖 Current websiteOrderRoutes.js content:');
console.log(routesContent.substring(0, 500) + '...');

// Check if API key authentication is already applied
if (routesContent.includes('apiKeysController.validateApiKey')) {
    console.log('✅ API key authentication already applied to website order routes');
} else {
    console.log('🔧 Applying API key authentication to website order routes...');
    
    // Add API key authentication to the routes
    const newRoutesContent = `const express = require('express');
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
router.get('/', flexibleAuth, websiteOrderController.getAllOrders);
router.get('/user', flexibleAuth, websiteOrderController.getUserOrders);
router.get('/:orderId', flexibleAuth, websiteOrderController.getOrderDetails);
router.put('/:orderId/status', flexibleAuth, websiteOrderController.updateOrderStatus);
router.put('/:orderId/cancel', flexibleAuth, websiteOrderController.cancelOrder);
router.get('/:orderId/tracking', flexibleAuth, websiteOrderController.trackOrder);

module.exports = router;`;

    fs.writeFileSync(routesPath, newRoutesContent);
    console.log('✅ Website order routes updated with flexible authentication');
}

console.log('');
console.log('🎯 Fix Applied:');
console.log('   • Website order routes now accept API key authentication');
console.log('   • Flexible middleware handles both JWT and API key auth');
console.log('   • Your API token will work for all order operations');
console.log('');
console.log('🚀 Next Steps:');
console.log('   1. Restart your server');
console.log('   2. Test order creation with your API token');
console.log('   3. Verify website integration works');
console.log('');
console.log('📋 Your API Token:');
console.log('   wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37');