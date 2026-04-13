const express = require('express');
const router = express.Router();
const bulkUploadController = require('../controllers/bulkUploadController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// POST /api/bulk-upload - Upload bulk inventory data (main endpoint)
router.post('/', 
    authenticateToken, 
    checkPermission('INVENTORY_EDIT'), 
    bulkUploadController.bulkUpload
);

// POST /api/bulk-upload/progress - Upload bulk inventory data with real-time progress
router.post('/progress', 
    authenticateToken, 
    checkPermission('INVENTORY_EDIT'), 
    bulkUploadController.bulkUploadWithProgress
);

// GET /api/bulk-upload/warehouses - Get available warehouses
router.get('/warehouses', 
    authenticateToken, 
    bulkUploadController.getWarehouses
);

// GET /api/bulk-upload/history - Get bulk upload history
router.get('/history', 
    authenticateToken, 
    checkPermission('INVENTORY_VIEW'), 
    bulkUploadController.getBulkUploadHistory
);

module.exports = router;
