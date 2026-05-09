/**
 * ENHANCED AUDIT LOGGER
 * Complete audit logging system with 200+ event types
 * Includes admin controls, session tracking, and real-time monitoring
 */

const db = require('./db/connection');
const IPGeolocationTracker = require('./IPGeolocationTracker');

// Event severity levels
const SEVERITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
};

// Event categories
const CATEGORY = {
    AUTHENTICATION: 'AUTHENTICATION',
    USER_MANAGEMENT: 'USER_MANAGEMENT',
    INVENTORY: 'INVENTORY',
    DISPATCH: 'DISPATCH',
    RETURNS: 'RETURNS',
    WAREHOUSE: 'WAREHOUSE',
    ORDERS: 'ORDERS',
    PRODUCTS: 'PRODUCTS',
    BILLING: 'BILLING',
    SUPPORT: 'SUPPORT',
    WEBSITE: 'WEBSITE',
    SYSTEM: 'SYSTEM'
};

// Critical events that require immediate attention
const CRITICAL_EVENTS = [
    'USER_LOGIN_FAILED',
    'USER_FORCE_LOGOUT',
    'USER_DISABLE',
    'USER_DELETE',
    'USER_ROLE_CHANGE',
    'PERMISSION_BULK_UPDATE',
    'PERMISSION_ADD',
    'PERMISSION_REMOVE',
    'ROLE_DELETE',
    'API_KEY_DELETE',
    'API_KEY_REGENERATE',
    'API_KEY_AUTH_FAILED',
    '2FA_VERIFY_FAILED',
    'ACCOUNT_LOCK',
    'STOCK_MISMATCH_DETECTED',
    'DAMAGE_ITEM_WRITTEN_OFF',
    'DATABASE_BACKUP',
    'DATABASE_RESTORE',
    'MAINTENANCE_MODE_ENABLE',
    'SYSTEM_SETTINGS_UPDATE',
    'SECURITY_SCAN',
    'FIREWALL_RULE_UPDATE'
];

class EnhancedAuditLogger {
    constructor() {
        this.geoTracker = new IPGeolocationTracker();
        this.eventQueue = [];
        this.isProcessing = false;
    }

    /**
     * Extract real IP address from request (handles Cloudflare and proxies)
     */
    extractRealIP(req) {
        const ipSources = [
            req.headers['cf-connecting-ip'],
            req.headers['x-forwarded-for'],
            req.headers['x-real-ip'],
            req.headers['x-client-ip'],
            req.connection?.remoteAddress,
            req.socket?.remoteAddress,
            req.ip,
            '127.0.0.1'
        ];

        for (const source of ipSources) {
            if (source) {
                const ip = source.split(',')[0].trim();
                if (this.isValidIP(ip)) {
                    return ip;
                }
            }
        }

        return '127.0.0.1';
    }

    /**
     * Validate IP address format
     */
    isValidIP(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === '::1';
    }

    /**
     * Extract user ID from request
     */
    extractUserID(req) {
        if (req.user?.id) return req.user.id;
        if (req.userId) return req.userId;
        if (req.session?.userId) return req.session.userId;
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const jwt = require('jsonwebtoken');
                const decoded = jwt.decode(token);
                if (decoded?.id) return decoded.id;
                if (decoded?.userId) return decoded.userId;
            } catch (error) {
                // JWT decode failed
            }
        }

        return null;
    }

    /**
     * Extract user information from request
     */
    extractUserInfo(req) {
        return {
            id: this.extractUserID(req),
            name: req.user?.name || req.userName || null,
            email: req.user?.email || req.userEmail || null,
            role: req.user?.role || req.userRole || null
        };
    }

    /**
     * Determine event severity
     */
    getEventSeverity(eventType) {
        if (CRITICAL_EVENTS.includes(eventType)) {
            return SEVERITY.CRITICAL;
        }

        if (eventType.includes('DELETE') || eventType.includes('DISABLE') || eventType.includes('FORCE')) {
            return SEVERITY.HIGH;
        }

        if (eventType.includes('CREATE') || eventType.includes('UPDATE') || eventType.includes('EXPORT')) {
            return SEVERITY.MEDIUM;
        }

        return SEVERITY.LOW;
    }

    /**
     * Parse action from event type
     */
    parseAction(eventType) {
        if (eventType.includes('LOGIN')) return 'LOGIN';
        if (eventType.includes('LOGOUT')) return 'LOGOUT';
        if (eventType.includes('CREATE')) return 'CREATE';
        if (eventType.includes('ADD')) return 'CREATE';
        if (eventType.includes('REGENERATE')) return 'UPDATE';
        if (eventType.includes('GENERATE')) return 'CREATE';
        if (eventType.includes('UPDATE') || eventType.includes('CHANGE') || eventType.includes('ADJUST') || eventType.includes('ASSIGN')) return 'UPDATE';
        if (eventType.includes('DELETE')) return 'DELETE';
        if (eventType.includes('DISABLE') || eventType.includes('LOCK')) return 'DELETE';
        if (eventType.includes('CANCEL') || eventType.includes('REJECT') || eventType.includes('FAILED')) return 'DELETE';
        if (eventType.includes('APPROVE') || eventType.includes('RECEIVE') || eventType.includes('COMPLETE') || eventType.includes('SUCCESS')) return 'UPDATE';
        if (eventType.includes('VIEW') || eventType.includes('ACCESS')) return 'VIEW';
        if (eventType.includes('USED')) return 'VIEW';
        if (eventType.includes('EXPORT')) return 'EXPORT';
        if (eventType.includes('DOWNLOAD')) return 'EXPORT';
        return 'OTHER';
    }

    /**
     * Parse resource type from event type
     */
    parseResourceType(eventType) {
        if (eventType.includes('USER')) return 'USER';
        if (eventType.includes('ROLE')) return 'ROLE';
        if (eventType.includes('PERMISSION')) return 'PERMISSION';
        if (eventType.includes('INVENTORY') || eventType.includes('STOCK')) return 'INVENTORY';
        if (eventType.includes('DISPATCH')) return 'DISPATCH';
        if (eventType.includes('RETURN')) return 'RETURN';
        if (eventType.includes('DAMAGE') || eventType.includes('RECOVERY')) return 'DAMAGE';
        if (eventType.includes('WAREHOUSE')) return 'WAREHOUSE';
        if (eventType.includes('STORE')) return 'STORE';
        if (eventType.includes('ORDER')) return 'ORDER';
        if (eventType.includes('PRODUCT')) return 'PRODUCT';
        if (eventType.includes('BILL') || eventType.includes('INVOICE') || eventType.includes('PAYMENT')) return 'BILLING';
        if (eventType.includes('SUPPORT') || eventType.includes('TICKET')) return 'SUPPORT';
        if (eventType.includes('WEBSITE') || eventType.includes('CUSTOMER')) return 'WEBSITE';
        if (eventType.includes('API_KEY') || eventType.includes('WEBHOOK')) return 'API';
        if (eventType.includes('DELIVERY') || eventType.includes('COURIER') || eventType.includes('AWB') || eventType.includes('PACKAGE')) return 'DISPATCH';
        if (eventType.includes('SESSION') || eventType.includes('2FA') || eventType.includes('PASSWORD') || eventType.includes('ACCOUNT')) return 'SECURITY';
        if (eventType.includes('SYSTEM') || eventType.includes('DATABASE')) return 'SYSTEM';
        return 'OTHER';
    }

    /**
     * Main logging method
     */
    async logEvent(eventType, eventData = {}, req = null, userId = null) {
        try {
            const realIP = req ? this.extractRealIP(req) : '127.0.0.1';
            const userInfo = req ? this.extractUserInfo(req) : { id: userId, name: null, email: null, role: null };
            const locationData = await this.geoTracker.getLocationData(realIP);

            const auditEntry = {
                // Event Information
                event_type: eventType,
                action: this.parseAction(eventType),
                resource_type: this.parseResourceType(eventType),
                resource_id: eventData.resourceId || eventData.id || null,

                // User Information
                user_id: userInfo.id,
                user_name: userInfo.name,
                user_email: userInfo.email,
                user_role: userInfo.role,

                // Request Information
                ip_address: realIP,
                user_agent: req?.headers['user-agent'] || 'Unknown',
                request_method: req?.method || null,
                request_url: req?.originalUrl || req?.url || null,
                request_body: req?.body ? JSON.stringify(req.body) : null,
                response_status: eventData.responseStatus || 200,

                // Location Information
                location_country: locationData?.country || null,
                location_city: locationData?.city || null,
                location_region: locationData?.region || null,
                location_coordinates: locationData?.coordinates || null,
                location_timezone: locationData?.timezone || null,
                location_isp: locationData?.isp || null,

                // Event Details
                details: JSON.stringify(eventData),
                old_values: eventData.oldValues ? JSON.stringify(eventData.oldValues) : null,
                new_values: eventData.newValues ? JSON.stringify(eventData.newValues) : null,

                // Status & Metadata
                status: eventData.status || 'SUCCESS',
                error_message: eventData.error || null,
                severity: this.getEventSeverity(eventType),

                created_at: new Date()
            };

            // Insert into database
            await db.query(
                `INSERT INTO audit_logs SET ?`,
                auditEntry
            );

            // Check if alert should be triggered
            await this.checkAlerts(eventType, auditEntry);

            // Update statistics
            await this.updateStats(eventType, auditEntry);

            console.log(`✅ Audit log created: ${eventType} by user ${userInfo.id || 'SYSTEM'}`);

            return true;
        } catch (error) {
            console.error('❌ Failed to create audit log:', error);
            return false;
        }
    }

    /**
     * Check if alerts should be triggered
     */
    async checkAlerts(eventType, auditEntry) {
        try {
            // Check for critical events
            if (CRITICAL_EVENTS.includes(eventType)) {
                await this.triggerAlert('CRITICAL_EVENT', eventType, auditEntry);
            }

            // Check for failed login attempts (brute force detection)
            if (eventType === 'USER_LOGIN_FAILED') {
                const [failedAttempts] = await db.query(
                    `SELECT COUNT(*) as count FROM audit_logs 
                     WHERE event_type = 'USER_LOGIN_FAILED' 
                     AND ip_address = ? 
                     AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
                    [auditEntry.ip_address]
                );

                if (failedAttempts[0].count >= 5) {
                    await this.triggerAlert('BRUTE_FORCE_ATTEMPT', eventType, auditEntry);
                }
            }

            // Check for suspicious activity (multiple IPs for same user)
            if (eventType === 'USER_LOGIN_SUCCESS' && auditEntry.user_id) {
                const [uniqueIPs] = await db.query(
                    `SELECT COUNT(DISTINCT ip_address) as count FROM audit_logs 
                     WHERE user_id = ? 
                     AND event_type = 'USER_LOGIN_SUCCESS'
                     AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
                    [auditEntry.user_id]
                );

                if (uniqueIPs[0].count >= 3) {
                    await this.triggerAlert('SUSPICIOUS_ACTIVITY', eventType, auditEntry);
                }
            }
        } catch (error) {
            console.error('❌ Failed to check alerts:', error);
        }
    }

    /**
     * Trigger alert
     */
    async triggerAlert(alertType, eventType, auditEntry) {
        try {
            console.log(`🚨 ALERT: ${alertType} - ${eventType}`);
            
            // TODO: Send email, Slack notification, SMS, etc.
            // For now, just log to console
            
            // Update last_triggered_at in audit_log_alerts table
            await db.query(
                `UPDATE audit_log_alerts 
                 SET last_triggered_at = NOW() 
                 WHERE alert_type = ? AND event_type = ?`,
                [alertType, eventType]
            );
        } catch (error) {
            console.error('❌ Failed to trigger alert:', error);
        }
    }

    /**
     * Update statistics
     */
    async updateStats(eventType, auditEntry) {
        try {
            const today = new Date().toISOString().split('T')[0];

            await db.query(
                `INSERT INTO audit_log_stats 
                 (date, event_type, action, resource_type, count, success_count, failure_count, unique_users, unique_ips)
                 VALUES (?, ?, ?, ?, 1, ?, ?, 1, 1)
                 ON DUPLICATE KEY UPDATE
                 count = count + 1,
                 success_count = success_count + ?,
                 failure_count = failure_count + ?,
                 unique_users = unique_users + 1,
                 unique_ips = unique_ips + 1`,
                [
                    today,
                    eventType,
                    auditEntry.action,
                    auditEntry.resource_type,
                    auditEntry.status === 'SUCCESS' ? 1 : 0,
                    auditEntry.status === 'FAILURE' ? 1 : 0,
                    auditEntry.status === 'SUCCESS' ? 1 : 0,
                    auditEntry.status === 'FAILURE' ? 1 : 0
                ]
            );
        } catch (error) {
            console.error('❌ Failed to update stats:', error);
        }
    }

    /**
     * Track user session
     */
    async trackSession(userId, sessionToken, req) {
        try {
            const realIP = this.extractRealIP(req);
            const locationData = await this.geoTracker.getLocationData(realIP);

            await db.query(
                `INSERT INTO user_sessions 
                 (user_id, session_token, ip_address, user_agent, location_country, location_city, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
                [
                    userId,
                    sessionToken,
                    realIP,
                    req.headers['user-agent'] || 'Unknown',
                    locationData?.country || null,
                    locationData?.city || null
                ]
            );

            console.log(`✅ Session tracked for user ${userId}`);
        } catch (error) {
            console.error('❌ Failed to track session:', error);
        }
    }

    /**
     * End user session
     */
    async endSession(sessionToken) {
        try {
            await db.query(
                `UPDATE user_sessions 
                 SET is_active = FALSE 
                 WHERE session_token = ?`,
                [sessionToken]
            );

            console.log(`✅ Session ended: ${sessionToken}`);
        } catch (error) {
            console.error('❌ Failed to end session:', error);
        }
    }

    /**
     * Force logout user (admin action)
     */
    async forceLogoutUser(userId, adminUserId, req) {
        try {
            // End all active sessions for the user
            await db.query(
                `UPDATE user_sessions 
                 SET is_active = FALSE 
                 WHERE user_id = ? AND is_active = TRUE`,
                [userId]
            );

            // Log the admin action
            await this.logEvent('USER_FORCE_LOGOUT', {
                resourceId: userId,
                adminUserId: adminUserId,
                reason: 'Admin forced logout'
            }, req, adminUserId);

            console.log(`✅ User ${userId} force logged out by admin ${adminUserId}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to force logout user:', error);
            return false;
        }
    }

    /**
     * Disable user account (admin action)
     */
    async disableUser(userId, adminUserId, reason, req) {
        try {
            // Update user status
            await db.query(
                `UPDATE users 
                 SET is_active = FALSE, disabled_at = NOW(), disabled_by = ?, disabled_reason = ?
                 WHERE id = ?`,
                [adminUserId, reason, userId]
            );

            // End all active sessions
            await db.query(
                `UPDATE user_sessions 
                 SET is_active = FALSE 
                 WHERE user_id = ?`,
                [userId]
            );

            // Log the admin action
            await this.logEvent('USER_DISABLE', {
                resourceId: userId,
                adminUserId: adminUserId,
                reason: reason
            }, req, adminUserId);

            console.log(`✅ User ${userId} disabled by admin ${adminUserId}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to disable user:', error);
            return false;
        }
    }

    /**
     * Enable user account (admin action)
     */
    async enableUser(userId, adminUserId, req) {
        try {
            // Update user status
            await db.query(
                `UPDATE users 
                 SET is_active = TRUE, disabled_at = NULL, disabled_by = NULL, disabled_reason = NULL
                 WHERE id = ?`,
                [userId]
            );

            // Log the admin action
            await this.logEvent('USER_ENABLE', {
                resourceId: userId,
                adminUserId: adminUserId
            }, req, adminUserId);

            console.log(`✅ User ${userId} enabled by admin ${adminUserId}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to enable user:', error);
            return false;
        }
    }
}

// Export singleton instance
module.exports = new EnhancedAuditLogger();
