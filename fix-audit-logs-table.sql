-- Fix audit_logs table schema
-- Add missing event_type column and ensure proper structure

-- Drop and recreate the table with correct schema
DROP TABLE IF EXISTS audit_logs;

CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    event_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
);

-- Show the table structure to confirm
DESCRIBE audit_logs;

-- Insert a test record to verify the table works
INSERT INTO audit_logs (event_type, user_id, ip_address, user_agent, event_data, created_at)
VALUES ('TEST_EVENT', 1, '127.0.0.1', 'Test Agent', '{"test": "data"}', NOW());

-- Show the test record
SELECT * FROM audit_logs WHERE event_type = 'TEST_EVENT';

-- Clean up test record
DELETE FROM audit_logs WHERE event_type = 'TEST_EVENT';