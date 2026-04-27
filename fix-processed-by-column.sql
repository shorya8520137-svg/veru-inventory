-- Fix processed_by column to accept names instead of user IDs
-- This matches the self-transfer form behavior

ALTER TABLE returns_main 
MODIFY COLUMN processed_by VARCHAR(100) NULL 
COMMENT 'Name of person who processed the return (e.g., Anurag Singh, Mahesh)';

-- Verify the change
DESCRIBE returns_main;

-- Show current data
SELECT id, processed_by, product_type, quantity FROM returns_main;
