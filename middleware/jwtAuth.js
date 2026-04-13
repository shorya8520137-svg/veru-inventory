const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT verification middleware
const verifyJWT = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token.'
                });
            }

            // Attach user info to request
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };

            next();
        });

    } catch (error) {
        console.error('JWT verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Token verification failed.'
        });
    }
};

module.exports = { verifyJWT };
