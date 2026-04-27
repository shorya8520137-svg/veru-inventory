-- Add processed_by column to damage_recovery_log table
-- This will store the name from processed_persons table

ALTER TABLE damage_recovery_log 
ADD COLUMN processed_by VARCHAR(100) NULL 
COMMENT 'Name of person who processed (e.g., Anurag Singh, Mahesh)';

-- Add index for performance
CREATE INDEX idx_damage_recovery_processed_by ON damage_recovery_log(processed_by);

-- Verify the change
DESCRIBE damage_recovery_log;

-- Show current structure
SELECT * FROM damage_recovery_log LIMIT 5;
