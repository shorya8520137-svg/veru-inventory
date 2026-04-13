-- Add profile fields to users table
-- Run this SQL to add missing profile fields

-- Add phone column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;

-- Add department column if it doesn't exist  
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT NULL;

-- Add company column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255) DEFAULT NULL;

-- Add website column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL;

-- Add avatar column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) DEFAULT NULL;

-- Add updated_at column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create uploads directory structure (run this on server)
-- mkdir -p public/uploads/avatars

-- Verification query
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'inventory_db' 
AND TABLE_NAME = 'users' 
ORDER BY ORDINAL_POSITION;