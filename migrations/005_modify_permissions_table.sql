-- Migration: Modify permissions table with new columns
-- Task: 1.5
-- Description: Add parent_permission_id, permission_level, is_dangerous, feature_section

ALTER TABLE `permissions`
ADD COLUMN IF NOT EXISTS `parent_permission_id` INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `permission_level` INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS `is_dangerous` BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS `feature_section` VARCHAR(50);

-- Add foreign key for parent_permission_id
ALTER TABLE `permissions`
ADD CONSTRAINT `fk_parent_permission` 
FOREIGN KEY (`parent_permission_id`) REFERENCES `permissions`(`id`) ON DELETE SET NULL;

-- Add indexes
ALTER TABLE `permissions`
ADD INDEX IF NOT EXISTS `idx_feature_section` (`feature_section`),
ADD INDEX IF NOT EXISTS `idx_dangerous` (`is_dangerous`);
