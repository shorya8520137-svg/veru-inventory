-- Rollback Script for Permissions Redesign
-- WARNING: This will remove all new tables and modifications
-- Use only if you need to completely undo the permissions redesign

-- Drop new tables (in reverse order of creation)
DROP TABLE IF EXISTS `permission_conflicts`;
DROP TABLE IF EXISTS `permission_dependencies`;
DROP TABLE IF EXISTS `warehouse_access_levels`;
DROP TABLE IF EXISTS `permission_templates`;

-- Remove new columns from permissions table
ALTER TABLE `permissions`
DROP FOREIGN KEY IF EXISTS `fk_parent_permission`,
DROP INDEX IF EXISTS `idx_feature_section`,
DROP INDEX IF EXISTS `idx_dangerous`,
DROP COLUMN IF EXISTS `parent_permission_id`,
DROP COLUMN IF EXISTS `permission_level`,
DROP COLUMN IF EXISTS `is_dangerous`,
DROP COLUMN IF EXISTS `feature_section`;

-- Remove new columns from audit_logs table
ALTER TABLE `audit_logs`
DROP INDEX IF EXISTS `idx_bulk_operation`,
DROP COLUMN IF EXISTS `before_state_json`,
DROP COLUMN IF EXISTS `after_state_json`,
DROP COLUMN IF EXISTS `bulk_operation_id`;

-- Note: This rollback does NOT restore old data
-- Make sure you have a backup before running this script
