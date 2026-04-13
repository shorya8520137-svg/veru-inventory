const express = require('express');
const router = express.Router();
const websiteCustomersController = require('../controllers/websiteCustomersController');

// Authentication is handled by global middleware in server.js
// No need to apply it again here

// Get all customers with pagination and filters
router.get('/', websiteCustomersController.getAllCustomers);

// Get customer statistics
router.get('/stats', websiteCustomersController.getCustomerStats);

// Get recent logins
router.get('/recent-logins', websiteCustomersController.getRecentLogins);

// Get single customer by ID
router.get('/:id', websiteCustomersController.getCustomerById);

// Toggle customer status (suspend/activate)
router.patch('/:id/status', websiteCustomersController.toggleCustomerStatus);

// Delete customer (soft delete)
router.delete('/:id', websiteCustomersController.deleteCustomer);

module.exports = router;
