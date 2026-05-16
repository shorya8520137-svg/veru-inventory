-- Add missing processed_by column to returns_main table
-- This column was lost during database migration a few months ago

-- Check if column exists first
SELECT COUNT(*) AS column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'returns_main' 
AND COLUMN_NAME = 'processed_by';

-- Add the column if it doesn't exist
ALTER TABLE returns_main 
ADD COLUMN IF NOT EXISTS processed_by VARCHAR(255) DEFAULT NULL COMMENT 'User who processed the return' 
AFTER id;

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'returns_main' 
AND COLUMN_NAME = 'processed_by';
