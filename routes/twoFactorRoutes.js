/**
 * TWO FACTOR AUTHENTICATION ROUTES
 * API routes for 2FA functionality
 */

const express = require('express');
const router = express.Router();
const TwoFactorController = require('../controllers/twoFactorController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Generate 2FA setup (secret and QR code)
router.post('/setup', TwoFactorController.generateSetup);

// Verify token and enable 2FA
router.post('/verify-enable', TwoFactorController.verifyAndEnable);

// Verify 2FA token (for login)
router.post('/verify', TwoFactorController.verifyToken);

// Get 2FA status
router.get('/status', TwoFactorController.getStatus);

// Disable 2FA
router.post('/disable', TwoFactorController.disable);

// Regenerate backup codes
router.post('/regenerate-backup-codes', TwoFactorController.regenerateBackupCodes);

module.exports = router;