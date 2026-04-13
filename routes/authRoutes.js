const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

/**
 * AUTH ROUTES
 */

// POST /api/auth/login - User login
router.post('/login', authController.login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticateToken, authController.getCurrentUser);

// POST /api/auth/logout - User logout (protected)
router.post('/logout', authenticateToken, authController.logout);

// POST /api/auth/change-password - Change password (protected)
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;