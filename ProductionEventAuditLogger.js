/**
 * PRODUCTION EVENT AUDIT LOGGER
 * Handles comprehensive event logging for production environment
 * Fixes user_id and ip_address NULL issues + Cloudflare IP tracking
 */

const db = require('./db/connection');
const IPGeolocationTracker = require('./IPGeolocationTracker');

class ProductionEventAuditLogger {
    constructor() {
        this.geoTracker = new IPGeolocationTracker();
        this.eventQueue = [];
        this.isProcessing = false;
    }

    /**
     * Extract real IP address from request (handles Cloudflare and proxies)
     */
    extractRealIP(req) {
        // Priority order for IP extraction
        const ipSources = [
            req.headers['cf-connecting-ip'],        // Cloudflare
            req.headers['x-forwarded-for'],         // Standard proxy header
            req.headers['x-real-ip'],               // Nginx proxy
            req.headers['x-client-ip'],             // Apache proxy
            req.connection?.remoteAddress,          // Direct connection
            req.socket?.remoteAddress,              // Socket connection
            req.ip,                                 // Express.js
            '127.0.0.1'                            // Fallback
        ];

        for (const source of ipSources) {
            if (source) {
                // Handle comma-separated IPs (x-forwarded-for can have multiple)
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
     * Extract user ID from request (JWT token, session, etc.)
     */
    extractUserID(req) {
        // Try multiple sources for user ID
        if (req.user?.id) return req.user.id;
        if (req.userId) return req.userId;
        if (req.session?.userId) return req.session.userId;
        if (req.body?.userId) return req.body.userId;
        if (req.query?.userId) return req.query.userId;
        
        // Try to extract from JWT token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const jwt = require('jsonwebtoken');
                const decoded = jwt.decode(token);
                if (decoded?.id) return decoded.id;
                if (decoded?.userId) return decoded.userId;
            } catch (error) {
                // JWT decode failed, continue
            }
        }

        return null;
    }

    /**
     * Log event to audit_logs table
     */
    async logEvent(eventType, eventData, req = null, userId = null) {
        try {
            const realIP = req ? this.extractRealIP(req) : '127.0.0.1';
            const realUserId = userId || (req ? this.extractUserID(req) : null);
            
            // Get location data
            const locationData = await this.geoTracker.getLocationData(realIP);
            
            const auditEntry = {
                event_type: eventType,
                user_id: realUserId,
                ip_address: realIP,
                user_agent: req?.headers['user-agent'] || 'Unknown',
                event_data: JSON.stringify({
                    ...eventData,
                    location: locationData,
                    timestamp: new Date().toISOString(),
                    server_time: new Date().toLocaleString(),
                    headers: req ? {
                        'cf-connecting-ip': req.headers['cf-connecting-ip'],
                        'x-forwarded-for': req.headers['x-forwarded-for'],
                        'x-real-ip': req.headers['x-real-ip']
                    } : null
                }),
                created_at: new Date()
            };

            // Add to queue for batch processing
            this.eventQueue.push(auditEntry);
            
            // Process queue if not already processing
            if (!this.isProcessing) {
                this.processEventQueue();
            }

            console.log(`📝 Event logged: ${eventType} (User: ${realUserId}, IP: ${realIP})`);
            return true;

        } catch (error) {
            console.error('❌ Audit logging error:', error);
            return false;
        }
    }

    /**
     * Process event queue (batch insert for performance)
     */
    async processEventQueue() {
        if (this.isProcessing || this.eventQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const events = [...this.eventQueue];
        this.eventQueue = [];

        try {
            if (events.length === 1) {
                // Single event insert
                const event = events[0];
                await this.insertSingleEvent(event);
            } else {
                // Batch insert
                await this.insertBatchEvents(events);
            }

            console.log(`✅ Processed ${events.length} audit events`);

        } catch (error) {
            console.error('❌ Event queue processing error:', error);
            // Re-add failed events to queue
            if (events && events.length > 0) {
                this.eventQueue.unshift(...events);
            }
        } finally {
            this.isProcessing = false;
            
            // Process remaining events if any
            if (this.eventQueue.length > 0) {
                setTimeout(() => this.processEventQueue(), 1000);
            }
        }
    }

    /**
     * Insert single event
     */
    async insertSingleEvent(event) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO audit_logs (action, resource_type, user_id, ip_address, user_agent, details, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(query, [
                event.event_type,           // Use event_type as action
                'SYSTEM',                   // Default resource_type
                event.user_id,
                event.ip_address,
                event.user_agent,
                event.event_data,          // This is already JSON string
                event.created_at
            ], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Insert batch events
     */
    async insertBatchEvents(events) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO audit_logs (action, resource_type, user_id, ip_address, user_agent, details, created_at)
                VALUES ?
            `;

            const values = events.map(event => [
                event.event_type,           // Use event_type as action
                'SYSTEM',                   // Default resource_type
                event.user_id,
                event.ip_address,
                event.user_agent,
                event.event_data,          // This is already JSON string
                event.created_at
            ]);

            db.query(query, [values], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Specific event logging methods
     */
    async logLogin(req, userId, loginResult) {
        return this.logEvent('USER_LOGIN', {
            action: 'LOGIN',
            user_id: userId,
            success: loginResult.success,
            login_method: loginResult.method || 'password',
            two_factor_used: loginResult.two_factor_used || false
        }, req, userId);
    }

    async logLogout(req, userId) {
        return this.logEvent('USER_LOGOUT', {
            action: 'LOGOUT',
            user_id: userId
        }, req, userId);
    }

    async logDispatchCreate(req, userId, dispatchData) {
        return this.logEvent('DISPATCH_CREATE', {
            action: 'CREATE_DISPATCH',
            user_id: userId,
            product_id: dispatchData.product_id,
            product_name: dispatchData.product_name,
            quantity: dispatchData.quantity,
            warehouse_from: dispatchData.warehouse_from,
            warehouse_to: dispatchData.warehouse_to,
            dispatch_id: dispatchData.dispatch_id
        }, req, userId);
    }

    async logDispatchUpdate(req, userId, dispatchId, updateData) {
        return this.logEvent('DISPATCH_UPDATE', {
            action: 'UPDATE_DISPATCH',
            user_id: userId,
            dispatch_id: dispatchId,
            updates: updateData
        }, req, userId);
    }

    async logStatusUpdate(req, userId, statusData) {
        return this.logEvent('STATUS_UPDATE', {
            action: 'UPDATE_STATUS',
            user_id: userId,
            entity_type: statusData.entity_type,
            entity_id: statusData.entity_id,
            old_status: statusData.old_status,
            new_status: statusData.new_status
        }, req, userId);
    }

    async logBulkUpload(req, userId, uploadData) {
        return this.logEvent('BULK_UPLOAD', {
            action: 'BULK_UPLOAD',
            user_id: userId,
            file_name: uploadData.file_name,
            records_count: uploadData.records_count,
            success_count: uploadData.success_count,
            error_count: uploadData.error_count
        }, req, userId);
    }

    async logPermissionChange(req, userId, permissionData) {
        return this.logEvent('PERMISSION_CHANGE', {
            action: 'CHANGE_PERMISSION',
            user_id: userId,
            target_user_id: permissionData.target_user_id,
            permission_type: permissionData.permission_type,
            old_value: permissionData.old_value,
            new_value: permissionData.new_value
        }, req, userId);
    }

    async logDataExport(req, userId, exportData) {
        return this.logEvent('DATA_EXPORT', {
            action: 'EXPORT_DATA',
            user_id: userId,
            export_type: exportData.export_type,
            filters: exportData.filters,
            record_count: exportData.record_count
        }, req, userId);
    }

    async logReturnCreate(req, userId, returnData) {
        return this.logEvent('RETURN_CREATE', {
            action: 'CREATE_RETURN',
            user_id: userId,
            return_id: returnData.return_id,
            product_name: returnData.product_name,
            quantity: returnData.quantity,
            reason: returnData.reason,
            awb: returnData.awb,
            condition: returnData.condition || 'good'
        }, req, userId);
    }

    async logDamageCreate(req, userId, damageData) {
        return this.logEvent('DAMAGE_CREATE', {
            action: 'CREATE_DAMAGE',
            user_id: userId,
            damage_id: damageData.damage_id,
            product_name: damageData.product_name,
            quantity: damageData.quantity,
            reason: damageData.reason,
            location: damageData.location
        }, req, userId);
    }

    async logRecoveryCreate(req, userId, recoveryData) {
        return this.logEvent('RECOVERY_CREATE', {
            action: 'CREATE_RECOVERY',
            user_id: userId,
            recovery_id: recoveryData.recovery_id,
            product_name: recoveryData.product_name,
            quantity: recoveryData.quantity,
            recovery_type: recoveryData.recovery_type,
            notes: recoveryData.notes
        }, req, userId);
    }

    /**
     * Get audit logs with filters
     */
    async getAuditLogs(filters = {}) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT al.*, u.name as user_name, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            // Apply filters
            if (filters.user_id) {
                query += ' AND al.user_id = ?';
                params.push(filters.user_id);
            }

            if (filters.event_type) {
                query += ' AND al.action = ?';  // Use action instead of event_type
                params.push(filters.event_type);
            }

            if (filters.ip_address) {
                query += ' AND al.ip_address = ?';
                params.push(filters.ip_address);
            }

            if (filters.date_from) {
                query += ' AND al.created_at >= ?';
                params.push(filters.date_from);
            }

            if (filters.date_to) {
                query += ' AND al.created_at <= ?';
                params.push(filters.date_to);
            }

            query += ' ORDER BY al.created_at DESC';

            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filters.limit));
            }

            db.query(query, params, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    // Parse details JSON and map action to event_type for compatibility
                    const logs = results.map(log => ({
                        ...log,
                        event_type: log.action,  // Map action to event_type for compatibility
                        event_data: typeof log.details === 'string' 
                            ? JSON.parse(log.details) 
                            : log.details
                    }));
                    resolve(logs);
                }
            });
        });
    }

    /**
     * Get audit statistics
     */
    async getAuditStats(timeframe = '24h') {
        return new Promise((resolve, reject) => {
            let timeCondition = '';
            
            switch (timeframe) {
                case '1h':
                    timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)';
                    break;
                case '24h':
                    timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
                    break;
                case '7d':
                    timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                    break;
                case '30d':
                    timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                    break;
                default:
                    timeCondition = '1=1';
            }

            const query = `
                SELECT 
                    action as event_type,
                    COUNT(*) as count,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT ip_address) as unique_ips
                FROM audit_logs 
                WHERE ${timeCondition}
                GROUP BY action
                ORDER BY count DESC
            `;

            db.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
}

module.exports = ProductionEventAuditLogger;