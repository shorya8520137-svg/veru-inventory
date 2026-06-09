const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { setClientDbContext } = require('../db/connection');

/**
 * AUTH ROUTES
 */

// POST /api/auth/login - User login
router.post('/login', authController.login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticateToken, setClientDbContext, authController.getCurrentUser);

// POST /api/auth/logout - User logout (protected)
router.post('/logout', authenticateToken, setClientDbContext, authController.logout);

// POST /api/auth/change-password - Change password (protected)
router.post('/change-password', authenticateToken, setClientDbContext, authController.changePassword);

module.exports = router;