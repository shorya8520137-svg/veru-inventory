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

// POST /api/onboarding/client - Onboard a new client (create DB + admin user)
router.post('/client', authenticateToken, checkPermission('CLIENTS_CREATE'), OnboardingController.onboardClient);

// GET /api/onboarding/clients - List all onboarded clients
router.get('/clients', authenticateToken, checkPermission('CLIENTS_VIEW'), OnboardingController.listClients);

module.exports = router;
