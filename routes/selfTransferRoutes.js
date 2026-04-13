const express = require('express');
const router = express.Router();
const selfTransferController = require('../controllers/selfTransferController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

/**
 * =====================================================
 * SELF TRANSFER ROUTES (With Permission Checks)
 * =====================================================
 */

// Create new self transfer
router.post('/create', 
    authenticateToken, 
    checkPermission('OPERATIONS_SELF_TRANSFER'), 
    selfTransferController.createSelfTransfer
);

// Get all self transfers with filters
router.get('/', 
    authenticateToken, 
    checkPermission('OPERATIONS_SELF_TRANSFER'), 
    selfTransferController.getSelfTransfers
);

module.exports = router;
