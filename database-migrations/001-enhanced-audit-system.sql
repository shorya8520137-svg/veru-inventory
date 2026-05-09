-- =====================================================
-- ENHANCED AUDIT SYSTEM - DATABASE MIGRATION
-- =====================================================
-- This migration enhances the audit logging system with:
-- 1. Enhanced audit_logs table with additional fields
-- 2. audit_log_stats table for aggregated statistics
-- 3. audit_log_alerts table for alert configuration
-- 4. user_sessions table for session tracking
-- =====================================================

-- Step 1: Enhance existing audit_logs table
-- Add new columns if they don't exist
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) AFTER id,
ADD COLUMN IF NOT EXISTS request_method VARCHAR(10) AFTER user_agent,
ADD COLUMN IF NOT EXISTS request_url TEXT AFTER request_method,
ADD COLUMN IF NOT EXISTS request_body JSON AFTER request_url,
ADD COLUMN IF NOT EXISTS response_status INT AFTER request_body,
ADD COLUMN IF NOT EXISTS location_country VARCHAR(100) AFTER response_status,
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100) AFTER location_country,
ADD COLUMN IF NOT EXISTS location_region VARCHAR(100) AFTER location_city,
ADD COLUMN IF NOT EXISTS location_coordinates VARCHAR(50) AFTER location_region,
ADD COLUMN IF NOT EXISTS location_timezone VARCHAR(50) AFTER location_coordinates,
ADD COLUMN IF NOT EXISTS location_isp VARCHAR(255) AFTER location_timezone,
ADD COLUMN IF NOT EXISTS old_values JSON AFTER details,
ADD COLUMN IF NOT EXISTS new_values JSON AFTER old_values,
ADD COLUMN IF NOT EXISTS status ENUM('SUCCESS', 'FAILURE', 'PENDING') DEFAULT 'SUCCESS' AFTER new_values,
ADD COLUMN IF NOT EXISTS error_message TEXT AFTER status,
ADD COLUMN IF NOT EXISTS severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM' AFTER error_message;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_location_country ON audit_logs(location_country);

-- Step 2: Create audit_log_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS audit_log_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    event_type VARCHAR(100),
    action VARCHAR(50),
    resource_type VARCHAR(100),
    count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    unique_users INT DEFAULT 0,
    unique_ips INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_stat (date, event_type, action, resource_type),
    INDEX idx_date (date),
    INDEX idx_event_type (event_type),
    INDEX idx_action (action),
    INDEX idx_resource_type (resource_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Create audit_log_alerts table for alert configuration
CREATE TABLE IF NOT EXISTS audit_log_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alert_type VARCHAR(100) NOT NULL COMMENT 'CRITICAL_EVENT, BRUTE_FORCE_ATTEMPT, SUSPICIOUS_ACTIVITY',
    event_type VARCHAR(100) COMMENT 'Specific event type to monitor',
    threshold_value INT COMMENT 'Threshold count to trigger alert',
    threshold_period VARCHAR(50) COMMENT '1_HOUR, 1_DAY, 1_WEEK',
    is_active BOOLEAN DEFAULT TRUE,
    notification_channels JSON COMMENT '["email", "slack", "sms"]',
    last_triggered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_alert_type (alert_type),
    INDEX idx_event_type (event_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Create user_sessions table for session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Add user account control columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP NULL AFTER is_active,
ADD COLUMN IF NOT EXISTS disabled_by INT NULL AFTER disabled_at,
ADD COLUMN IF NOT EXISTS disabled_reason TEXT NULL AFTER disabled_by;

-- Add foreign key for disabled_by
ALTER TABLE users 
ADD CONSTRAINT fk_users_disabled_by 
FOREIGN KEY (disabled_by) REFERENCES users(id) ON DELETE SET NULL;

-- Step 6: Insert default alert configurations
INSERT INTO audit_log_alerts (alert_type, event_type, threshold_value, threshold_period, notification_channels) VALUES
('CRITICAL_EVENT', 'USER_FORCE_LOGOUT', 1, '1_HOUR', '["email"]'),
('CRITICAL_EVENT', 'USER_DISABLE', 1, '1_HOUR', '["email"]'),
('CRITICAL_EVENT', 'DATABASE_BACKUP', 1, '1_DAY', '["email"]'),
('CRITICAL_EVENT', 'DATABASE_RESTORE', 1, '1_DAY', '["email", "slack"]'),
('CRITICAL_EVENT', 'SYSTEM_SETTINGS_UPDATE', 1, '1_HOUR', '["email"]'),
('CRITICAL_EVENT', 'MAINTENANCE_MODE_ENABLE', 1, '1_DAY', '["email", "slack"]'),
('BRUTE_FORCE_ATTEMPT', 'USER_LOGIN_FAILED', 5, '1_HOUR', '["email", "slack"]'),
('SUSPICIOUS_ACTIVITY', 'USER_LOGIN_SUCCESS', 3, '1_HOUR', '["email"]')
ON DUPLICATE KEY UPDATE 
    threshold_value = VALUES(threshold_value),
    threshold_period = VALUES(threshold_period),
    notification_channels = VALUES(notification_channels);

-- Step 7: Create view for recent audit activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
    al.id,
    al.event_type,
    al.action,
    al.resource_type,
    al.resource_id,
    al.user_id,
    u.name as user_name,
    u.email as user_email,
    al.ip_address,
    al.location_country,
    al.location_city,
    al.severity,
    al.status,
    al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 1000;

-- Step 8: Create stored procedure to clean old audit logs (retention policy)
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS cleanup_old_audit_logs(IN retention_days INT)
BEGIN
    DECLARE deleted_count INT;
    
    -- Delete audit logs older than retention period
    DELETE FROM audit_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL retention_days DAY)
    AND severity NOT IN ('CRITICAL', 'HIGH');
    
    SET deleted_count = ROW_COUNT();
    
    SELECT CONCAT('Deleted ', deleted_count, ' audit log records older than ', retention_days, ' days') as result;
END //

DELIMITER ;

-- Step 9: Create stored procedure to get audit statistics
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS get_audit_statistics(IN days INT)
BEGIN
    SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'FAILURE' THEN 1 ELSE 0 END) as failure_count,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as high_count
    FROM audit_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL days DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
END //

DELIMITER ;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- ✅ Enhanced audit_logs table with 15+ new fields
-- ✅ Created audit_log_stats table for analytics
-- ✅ Created audit_log_alerts table for monitoring
-- ✅ Created user_sessions table for session tracking
-- ✅ Added user account control columns
-- ✅ Inserted default alert configurations
-- ✅ Created views and stored procedures
-- =====================================================

SELECT 'Enhanced Audit System Migration Completed Successfully!' as status;
