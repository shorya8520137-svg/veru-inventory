const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// @route   GET /auth/google
// @desc    Start Google OAuth flow
// @access  Public
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })
);

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', { 
        session: false,
        failureRedirect: 'https://giftgala.in/login?error=auth_failed'
    }),
    (req, res) => {
        try {
            // User authenticated successfully
            const user = req.user;

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Redirect to frontend with token
            res.redirect(`https://giftgala.in/dashboard?token=${token}`);
        } catch (error) {
            console.error('Error in Google callback:', error);
            res.redirect('https://giftgala.in/login?error=token_generation_failed');
        }
    }
);

// @route   GET /auth/google/status
// @desc    Check Google OAuth configuration
// @access  Public
router.get('/google/status', (req, res) => {
    res.json({
        success: true,
        message: 'Google OAuth is configured',
        clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set',
        callbackURL: 'https://api.giftgala.in/auth/google/callback'
    });
});

module.exports = router;
