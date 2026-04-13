const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getWarehouseStaff,
    getLogistics,
    createOrderActivity,
    getOrderActivities,
    getOrderActivityById,
    updateOrderActivity,
    deleteOrderActivity
} = require('../controllers/warehouseOrderActivityController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Warehouse staff endpoint (for dropdowns)
router.get('/warehouse-staff', getWarehouseStaff);

// Logistics endpoint (for dropdowns)
router.get('/logistics', getLogistics);

// Routes (no file upload)
router.post('/', createOrderActivity);
router.get('/', getOrderActivities);
router.get('/:id', getOrderActivityById);
router.put('/:id', updateOrderActivity);
router.delete('/:id', deleteOrderActivity);

module.exports = router;