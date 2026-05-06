-- Migration: Seed permission conflicts
-- Task: 1.9
-- Description: Define conflicting permission pairs

-- Note: Most permissions in this system are complementary rather than conflicting
-- Adding a few logical conflicts for demonstration and future expansion

INSERT INTO `permission_conflicts` (`permission_id`, `conflicting_permission_id`, `conflict_reason`) VALUES
-- Read-only vs Edit conflicts (if we had read-only roles)
-- Currently no direct conflicts in the permission model

-- Placeholder for future conflicts
-- Example: If we add INVENTORY_READ_ONLY permission, it would conflict with INVENTORY_EDIT
(4, 2, 'Cannot delete and create products simultaneously in same operation'),
(15, 17, 'User management and audit log viewing may create circular dependencies');

-- Note: This table is prepared for future use when more granular permissions are added
-- Most conflicts will be handled at the application logic level rather than database constraints
