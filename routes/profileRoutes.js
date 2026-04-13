const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    upload,
    uploadAvatar,
    getProfile,
    updateProfile,
    getUserTickets
} = require('../controllers/profileController');

// All routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/', getProfile);

// Update user profile
router.put('/', updateProfile);

// Upload avatar
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);

// Get user's tickets
router.get('/tickets', getUserTickets);

module.exports = router;