/**
 * EVENT AUDIT LOGGER
 * Simple event logging service for audit trails
 */

const db = require('./db/connection');

class EventAuditLogger {
    constructor() {
        this.logQueue = [];
        this.isProcessing = false;
    }

    /**
     * Log an event to the audit_logs table
     */
    async logEvent(eventType, eventData, userId = null, ipAddress = null) {
        try {
            const logEntry = {
                event_type: eventType,
                user_id: userId,
                ip_address: ipAddress || '127.0.0.1',
                user_agent: 'Server',
                event_data: JSON.stringify({
                    ...eventData,
                    timestamp: new Date().toISOString(),
                    server_time: new Date().toLocaleString()
                }),
                created_at: new Date()
            };

            // Add to queue
            this.logQueue.push(logEntry);
            
            // Process queue
            if (!this.isProcessing) {
                this.processQueue();
            }

            console.log(`📝 Event logged: ${eventType} (User: ${userId})`);
            return true;

        } catch (error) {
            console.error('❌ Event logging error:', error);
            return false;
        }
    }

    /**
     * Process the log queue
     */
    async processQueue() {
        if (this.isProcessing || this.logQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            const entries = [...this.logQueue];
            this.logQueue = [];

            for (const entry of entries) {
                await this.insertLogEntry(entry);
            }

            console.log(`✅ Processed ${entries.length} audit log entries`);

        } catch (error) {
            console.error('❌ Queue processing error:', error);
        } finally {
            this.isProcessing = false;
            
            // Process remaining entries if any
            if (this.logQueue.length > 0) {
                setTimeout(() => this.processQueue(), 1000);
            }
        }
    }

    /**
     * Insert single log entry
     */
    async insertLogEntry(entry) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO audit_logs (event_type, user_id, ip_address, user_agent, event_data, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(query, [
                entry.event_type,
                entry.user_id,
                entry.ip_address,
                entry.user_agent,
                entry.event_data,
                entry.created_at
            ], (err, result) => {
                if (err) {
                    console.error('❌ Log insert error:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Specific logging methods for different event types
     */
    async logDamageReport(userId, damageData, ipAddress) {
        return this.logEvent('DAMAGE_REPORT', {
            action: 'CREATE_DAMAGE_REPORT',
            product_id: damageData.product_id,
            product_name: damageData.product_name,
            quantity: damageData.quantity,
            damage_type: damageData.damage_type,
            description: damageData.description,
            warehouse: damageData.warehouse
        }, userId, ipAddress);
    }

    async logRecoveryAction(userId, recoveryData, ipAddress) {
        return this.logEvent('RECOVERY_ACTION', {
            action: 'RECOVERY_PROCESS',
            damage_id: recoveryData.damage_id,
            recovery_type: recoveryData.recovery_type,
            recovered_quantity: recoveryData.recovered_quantity,
            recovery_notes: recoveryData.recovery_notes
        }, userId, ipAddress);
    }

    async logStatusUpdate(userId, statusData, ipAddress) {
        return this.logEvent('STATUS_UPDATE', {
            action: 'UPDATE_STATUS',
            entity_type: statusData.entity_type,
            entity_id: statusData.entity_id,
            old_status: statusData.old_status,
            new_status: statusData.new_status,
            notes: statusData.notes
        }, userId, ipAddress);
    }

    async logInventoryAdjustment(userId, adjustmentData, ipAddress) {
        return this.logEvent('INVENTORY_ADJUSTMENT', {
            action: 'ADJUST_INVENTORY',
            product_id: adjustmentData.product_id,
            product_name: adjustmentData.product_name,
            old_quantity: adjustmentData.old_quantity,
            new_quantity: adjustmentData.new_quantity,
            adjustment_reason: adjustmentData.adjustment_reason,
            warehouse: adjustmentData.warehouse
        }, userId, ipAddress);
    }

    async logDataAccess(userId, accessData, ipAddress) {
        return this.logEvent('DATA_ACCESS', {
            action: 'ACCESS_DATA',
            resource: accessData.resource,
            operation: accessData.operation,
            filters: accessData.filters,
            record_count: accessData.record_count
        }, userId, ipAddress);
    }

    /**
     * Get recent audit logs
     */
    async getRecentLogs(limit = 100) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT al.*, u.name as user_name, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.created_at DESC
                LIMIT ?
            `;

            db.query(query, [limit], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    const logs = results.map(log => ({
                        ...log,
                        event_data: typeof log.event_data === 'string' 
                            ? JSON.parse(log.event_data) 
                            : log.event_data
                    }));
                    resolve(logs);
                }
            });
        });
    }

    /**
     * Get logs by user
     */
    async getLogsByUser(userId, limit = 50) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT al.*, u.name as user_name, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.user_id = ?
                ORDER BY al.created_at DESC
                LIMIT ?
            `;

            db.query(query, [userId, limit], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    const logs = results.map(log => ({
                        ...log,
                        event_data: typeof log.event_data === 'string' 
                            ? JSON.parse(log.event_data) 
                            : log.event_data
                    }));
                    resolve(logs);
                }
            });
        });
    }

    /**
     * Get logs by event type
     */
    async getLogsByEventType(eventType, limit = 50) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT al.*, u.name as user_name, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.event_type = ?
                ORDER BY al.created_at DESC
                LIMIT ?
            `;

            db.query(query, [eventType, limit], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    const logs = results.map(log => ({
                        ...log,
                        event_data: typeof log.event_data === 'string' 
                            ? JSON.parse(log.event_data) 
                            : log.event_data
                    }));
                    resolve(logs);
                }
            });
        });
    }

    /**
     * Get audit statistics
     */
    async getAuditStats() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    event_type,
                    COUNT(*) as count,
                    COUNT(DISTINCT user_id) as unique_users,
                    MAX(created_at) as last_occurrence
                FROM audit_logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY event_type
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

module.exports = EventAuditLogger;