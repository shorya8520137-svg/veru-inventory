const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const productJourneyController = require('../controllers/productJourneyController');

router.get('/product-journey', authenticateToken, productJourneyController.getProductJourney);
router.get('/compare-products', authenticateToken, productJourneyController.compareProducts);

module.exports = router;
