/**
 * LOGIN EVENT TRACKING
 * Add this to your authentication route (server.js or authRoutes.js)
 */

// Helper function to get real IP address
const getRealIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.ip ||
           '127.0.0.1';
};

// Enhanced login route with audit logging
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Your existing login logic here...
        const user = await authenticateUser(email, password);
        
        if (user) {
            // Generate token
            const token = generateToken(user);
            
            // FIXED: Log LOGIN event with proper user_id and IP
            await PermissionsController.createAuditLog(
                user.id,  // FIXED: Use user.id, not userId
                'LOGIN',
                'SESSION',
                user.id,
                {
                    user_name: user.name,
                    user_email: user.email,
                    user_role: user.role_name,
                    login_time: new Date().toISOString(),
                    ip_address: getRealIP(req),
                    user_agent: req.get('User-Agent')
                }
            );
            
            // Update last_login in users table
            await db.execute(
                'UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?',
                [user.id]
            );
            
            res.json({
                success: true,
                token: token,
                user: user
            });
        } else {
            // FIXED: Log failed login attempt
            await PermissionsController.createAuditLog(
                null,  // No user ID for failed login
                'LOGIN',
                'SESSION',
                null,
                {
                    attempted_email: email,
                    failure_reason: 'Invalid credentials',
                    attempt_time: new Date().toISOString(),
                    ip_address: getRealIP(req),
                    user_agent: req.get('User-Agent')
                }
            );
            
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});