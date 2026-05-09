/**
 * ADMIN CONTROL ROUTES
 * API endpoints for admin user management and control
 * - Force logout users
 * - Disable/Enable user accounts
 * - View active sessions
 * - Audit log statistics
 */

const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const auditLogger = require('../EnhancedAuditLogger');

/**
 * GET /api/admin/users/:userId/sessions
 * Get all active sessions for a user
 */
router.get('/users/:userId/sessions', authenticateToken, requirePermission('users.manage'), async (req, res) => {
    try {
        const { userId } = req.params;

        const query = `
            SELECT 
                id,
                session_token,
                ip_address,
                user_agent,
                location_country,
                location_city,
                is_active,
                last_activity_at,
                created_at,
                expires_at
            FROM user_sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;

        db.query(query, [userId], (err, sessions) => {
            if (err) {
                console.error('Get user sessions error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch user sessions'
                });
            }

            res.json({
                success: true,
                data: sessions
            });
        });

    } catch (error) {
        console.error('Get user sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * POST /api/admin/users/:userId/force-logout
 * Force logout a user (end all active sessions)
 */
router.post('/users/:userId/force-logout', authenticateToken, requirePermission('users.manage'), async (req, res) => {
    try {
        const { userId } = req.params;
        const adminUserId = req.user.id;

        // Check if user exists
        db.query('SELECT id, name, email FROM users WHERE id = ?', [userId], async (err, users) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = users[0];

            // Use EnhancedAuditLogger to force logout
            const success = await auditLogger.forceLogoutUser(userId, adminUserId, req);

            if (success) {
                res.json({
                    success: true,
                    message: `User ${user.name} has been logged out successfully`
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to force logout user'
                });
            }
        });

    } catch (error) {
        console.error('Force logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * POST /api/admin/users/:userId/disable
 * Disable a user account
 */
router.post('/users/:userId/disable', authenticateToken, requirePermission('users.manage'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const adminUserId = req.user.id;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required to disable a user'
            });
        }

        // Check if user exists
        db.query('SELECT id, name, email, is_active FROM users WHERE id = ?', [userId], async (err, users) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = users[0];

            if (!user.is_active) {
                return res.status(400).json({
                    success: false,
                    message: 'User is already disabled'
                });
            }

            // Use EnhancedAuditLogger to disable user
            const success = await auditLogger.disableUser(userId, adminUserId, reason, req);

            if (success) {
                res.json({
                    success: true,
                    message: `User ${user.name} has been disabled successfully`
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to disable user'
                });
            }
        });

    } catch (error) {
        console.error('Disable user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * POST /api/admin/users/:userId/enable
 * Enable a disabled user account
 */
router.post('/users/:userId/enable', authenticateToken, requirePermission('users.manage'), async (req, res) => {
    try {
        const { userId } = req.params;
        const adminUserId = req.user.id;

        // Check if user exists
        db.query('SELECT id, name, email, is_active FROM users WHERE id = ?', [userId], async (err, users) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = users[0];

            if (user.is_active) {
                return res.status(400).json({
                    success: false,
                    message: 'User is already active'
                });
            }

            // Use EnhancedAuditLogger to enable user
            const success = await auditLogger.enableUser(userId, adminUserId, req);

            if (success) {
                res.json({
                    success: true,
                    message: `User ${user.name} has been enabled successfully`
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to enable user'
                });
            }
        });

    } catch (error) {
        console.error('Enable user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * GET /api/admin/audit-logs/stats
 * Get audit log statistics
 */
router.get('/audit-logs/stats', authenticateToken, requirePermission('audit_logs.view'), async (req, res) => {
    try {
        const { days = 7 } = req.query;

        // Get statistics using stored procedure
        db.query('CALL get_audit_statistics(?)', [days], (err, results) => {
            if (err) {
                console.error('Get audit statistics error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch audit statistics'
                });
            }

            res.json({
                success: true,
                data: results[0] || []
            });
        });

    } catch (error) {
        console.error('Get audit statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * GET /api/admin/active-sessions
 * Get all active sessions across all users
 */
router.get('/active-sessions', authenticateToken, requirePermission('audit_logs.view'), async (req, res) => {
    try {
        const query = `
            SELECT 
                us.id,
                us.user_id,
                u.name as user_name,
                u.email as user_email,
                us.ip_address,
                us.location_country,
                us.location_city,
                us.last_activity_at,
                us.created_at,
                us.expires_at
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            WHERE us.is_active = TRUE
            AND us.expires_at > NOW()
            ORDER BY us.last_activity_at DESC
        `;

        db.query(query, (err, sessions) => {
            if (err) {
                console.error('Get active sessions error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch active sessions'
                });
            }

            res.json({
                success: true,
                data: sessions,
                count: sessions.length
            });
        });

    } catch (error) {
        console.error('Get active sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * GET /api/admin/audit-logs/recent
 * Get recent audit log entries
 */
router.get('/audit-logs/recent', authenticateToken, requirePermission('audit_logs.view'), async (req, res) => {
    try {
        const { limit = 100, severity, action, resource_type } = req.query;

        let query = `
            SELECT 
                id,
                event_type,
                action,
                resource_type,
                resource_id,
                user_id,
                user_name,
                user_email,
                ip_address,
                location_country,
                location_city,
                severity,
                status,
                created_at
            FROM recent_audit_activity
            WHERE 1=1
        `;

        const params = [];

        if (severity) {
            query += ' AND severity = ?';
            params.push(severity);
        }

        if (action) {
            query += ' AND action = ?';
            params.push(action);
        }

        if (resource_type) {
            query += ' AND resource_type = ?';
            params.push(resource_type);
        }

        query += ' LIMIT ?';
        params.push(parseInt(limit));

        db.query(query, params, (err, logs) => {
            if (err) {
                console.error('Get recent audit logs error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch recent audit logs'
                });
            }

            res.json({
                success: true,
                data: logs,
                count: logs.length
            });
        });

    } catch (error) {
        console.error('Get recent audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * POST /api/admin/audit-logs/cleanup
 * Clean up old audit logs (retention policy)
 */
router.post('/audit-logs/cleanup', authenticateToken, requirePermission('system.manage'), async (req, res) => {
    try {
        const { retention_days = 90 } = req.body;

        // Log the cleanup action
        await auditLogger.logEvent('AUDIT_LOG_CLEANUP', {
            retention_days: retention_days
        }, req);

        // Execute cleanup stored procedure
        db.query('CALL cleanup_old_audit_logs(?)', [retention_days], (err, results) => {
            if (err) {
                console.error('Cleanup audit logs error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to cleanup audit logs'
                });
            }

            res.json({
                success: true,
                message: results[0][0].result
            });
        });

    } catch (error) {
        console.error('Cleanup audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
