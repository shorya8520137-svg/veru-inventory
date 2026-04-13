-- ═══════════════════════════════════════════════════════════════════
-- CREATE WEBSITE CUSTOMERS TABLE
-- ═══════════════════════════════════════════════════════════════════
-- 
-- Run this on AWS server:
-- mysql -u inventory_user -p inventory_db < CREATE_WEBSITE_CUSTOMERS_TABLE.sql
-- Password: StrongPass@123
--
-- Or manually:
-- mysql -u inventory_user -p inventory_db
-- Then copy-paste the CREATE TABLE statement below
-- ═══════════════════════════════════════════════════════════════════

USE inventory_db;

-- Create website_customers table
CREATE TABLE IF NOT EXISTS website_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table structure
DESCRIBE website_customers;

-- Check if table exists
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'inventory_db' 
AND TABLE_NAME = 'website_customers';

-- Show success message
SELECT '✅ Table created successfully!' as Status;
