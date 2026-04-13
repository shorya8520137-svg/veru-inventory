const express = require('express');
const router = express.Router();
const websiteAuthController = require('../controllers/websiteAuthController');
const { authenticateToken } = require('../middleware/auth');

/**
 * WEBSITE CUSTOMER AUTHENTICATION ROUTES
 * These routes are for your external website customers
 */

// POST /api/website-auth/signup - Customer signup
router.post('/signup', websiteAuthController.signup);

// POST /api/website-auth/login - Customer login
router.post('/login', websiteAuthController.login);

// POST /api/website-auth/google - Google OAuth login/signup
router.post('/google', websiteAuthController.googleAuth);

// GET /api/website-auth/profile - Get customer profile (protected)
router.get('/profile', authenticateToken, websiteAuthController.getProfile);

module.exports = router;
