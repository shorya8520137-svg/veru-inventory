-- ============================================
-- Profile Database Fix Script
-- ============================================
-- This script creates the user_profiles table
-- and ensures proper profile functionality
-- ============================================

USE inventory_db;

-- Check current users table structure
SELECT 'Current users table structure:' AS '';
DESCRIBE users;

-- Create user_profiles table if it doesn't exist
SELECT 'Creating user_profiles table...' AS '';
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    profile_image VARCHAR(500) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the user_profiles table structure
SELECT 'user_profiles table structure:' AS '';
DESCRIBE user_profiles;

-- Create initial profile entries for existing users (if they don't have one)
SELECT 'Creating profile entries for existing users...' AS '';
INSERT INTO user_profiles (user_id, profile_image, phone, address)
SELECT u.id, NULL, NULL, NULL
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.id IS NULL;

-- Show sample data
SELECT 'Sample user data with profiles:' AS '';
SELECT 
    u.id,
    u.name,
    u.email,
    u.role_id,
    u.created_at,
    up.profile_image,
    up.phone,
    up.address
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LIMIT 5;

SELECT 'Profile database fix completed!' AS '';
