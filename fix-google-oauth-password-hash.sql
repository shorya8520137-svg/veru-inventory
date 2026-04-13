-- Fix for Google OAuth: Make password_hash nullable
-- This allows Google OAuth users to be created without a password

-- Option 1: Make password_hash NULLABLE (RECOMMENDED)
ALTER TABLE website_customers 
MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- Option 2: Set a default value (Alternative)
-- ALTER TABLE website_customers 
-- MODIFY COLUMN password_hash VARCHAR(255) DEFAULT 'google_oauth_no_password';

-- Verify the change
DESCRIBE website_customers;
