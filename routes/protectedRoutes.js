const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/jwtAuth');

// @route   GET /api/protected
// @desc    Example protected route
// @access  Private (JWT required)
router.get('/protected', verifyJWT, (req, res) => {
    res.json({
        success: true,
        message: 'You have access to this protected route!',
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private (JWT required)
router.get('/profile', verifyJWT, (req, res) => {
    const db = require('../db/connection');
    
    const query = 'SELECT id, name, email, phone, google_id, created_at, last_login FROM website_customers WHERE id = ?';
    
    db.query(query, [req.user.id], (err, users) => {
        if (err) {
            console.error('Error fetching profile:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch profile'
            });
        }

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });
    });
});

module.exports = router;
