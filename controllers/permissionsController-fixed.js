/**
 * PERMISSIONS CONTROLLER - FIXED VERSION
 * Fixed: Added IP address and user agent capture
 */

class PermissionsController {
    // ... existing methods ...
    
    // FIXED: Enhanced audit logging with IP address
    static createAuditLog(userId, action, resource, resourceId, details, callback) {
        const sql = `
            INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Extract IP and user agent from details if provided
        const ipAddress = details?.ip_address || '127.0.0.1';
        const userAgent = details?.user_agent || 'Unknown';
        
        // Clean details (remove IP and user agent to avoid duplication)
        const cleanDetails = { ...details };
        delete cleanDetails.ip_address;
        delete cleanDetails.user_agent;
        
        const values = [
            userId,
            action,
            resource,
            resourceId,
            JSON.stringify(cleanDetails),
            ipAddress,  // FIXED: Now captures IP address
            userAgent   // FIXED: Now captures user agent
        ];
        
        // If no callback provided, return a promise
        if (!callback) {
            return new Promise((resolve, reject) => {
                db.query(sql, values, (err, result) => {
                    if (err) {
                        console.error('Create audit log error:', err);
                        reject(err);
                    } else {
                        console.log(`📝 Audit logged: ${action} ${resource} by user ${userId} from ${ipAddress}`);
                        resolve(result);
                    }
                });
            });
        }
        
        // Callback version
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Create audit log error:', err);
                callback(err);
            } else {
                console.log(`📝 Audit logged: ${action} ${resource} by user ${userId} from ${ipAddress}`);
                callback(null, result);
            }
        });
    }
}

module.exports = PermissionsController;