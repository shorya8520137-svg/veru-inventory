const express = require('express');
const router = express.Router();
const OnboardingController = require('../controllers/onboardingController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Auto-seed permissions when this module loads (on server start)
(async () => {
    try {
        await OnboardingController.ensurePermissions();
        console.log('✅ Client onboarding permissions seeded');
    } catch (err) {
        console.warn('⚠️ Could not seed onboarding permissions:', err.message);
    }
})();

// GET /api/onboarding/permissions - List available permissions for assignment
router.get('/permissions', authenticateToken, checkPermission('CLIENTS_CREATE'), OnboardingController.listAvailablePermissions);

// POST /api/onboarding/send-otp - Send OTP for phone verification
router.post('/send-otp', authenticateToken, checkPermission('CLIENTS_CREATE'), OnboardingController.sendOTP);

// POST /api/onboarding/verify-otp - Verify OTP for phone verification
router.post('/verify-otp', authenticateToken, checkPermission('CLIENTS_CREATE'), OnboardingController.verifyOTP);

// POST /api/onboarding/client - Onboard a new client (create DB + admin user)
router.post('/client', authenticateToken, checkPermission('CLIENTS_CREATE'), OnboardingController.onboardClient);

// GET /api/onboarding/clients - List all onboarded clients
router.get('/clients', authenticateToken, checkPermission('CLIENTS_VIEW'), OnboardingController.listClients);

module.exports = router;
