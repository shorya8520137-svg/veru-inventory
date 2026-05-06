-- Migration: Modify audit_logs table with new columns
-- Task: 1.6
-- Description: Add before_state_json, after_state_json, bulk_operation_id

ALTER TABLE `audit_logs`
ADD COLUMN IF NOT EXISTS `before_state_json` JSON,
ADD COLUMN IF NOT EXISTS `after_state_json` JSON,
ADD COLUMN IF NOT EXISTS `bulk_operation_id` VARCHAR(36);

-- Add index for bulk_operation_id
ALTER TABLE `audit_logs`
ADD INDEX IF NOT EXISTS `idx_bulk_operation` (`bulk_operation_id`);
