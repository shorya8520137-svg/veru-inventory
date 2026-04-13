const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debugController');

/**
 * DEBUG ROUTES
 * Temporary routes for debugging dispatch dimensions issue
 * NO AUTHENTICATION REQUIRED FOR TESTING
 */

// GET /api/debug/dispatch-dimensions/:barcode - Test dispatch dimensions for specific barcode
router.get('/dispatch-dimensions/:barcode?', 
    debugController.testDispatchDimensions
);

module.exports = router;