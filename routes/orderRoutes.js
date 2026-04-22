const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/orderCreatingController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/orders/create — create order + push to Shiprocket
router.post('/create', authenticateToken, (req, res) => controller.createOrder(req, res));

// GET /api/orders — list all orders
router.get('/', authenticateToken, (req, res) => controller.getOrders(req, res));

// GET /api/orders/:id — single order
router.get('/:id', authenticateToken, (req, res) => controller.getOrder(req, res));

module.exports = router;
