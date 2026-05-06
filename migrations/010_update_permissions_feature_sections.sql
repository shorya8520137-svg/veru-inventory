-- Migration: Update existing permissions with feature_section values
-- Task: 1.10
-- Description: Categorize all 58 permissions into 9 feature sections and mark dangerous permissions

-- System permissions
UPDATE `permissions` SET `feature_section` = 'System', `is_dangerous` = true WHERE `id` IN (15, 16, 17, 216);

-- Inventory permissions
UPDATE `permissions` SET `feature_section` = 'Inventory', `is_dangerous` = false WHERE `id` IN (5, 6, 215, 217);

-- Orders permissions
UPDATE `permissions` SET `feature_section` = 'Orders', `is_dangerous` = false WHERE `id` IN (7, 8, 9);

-- Products permissions
UPDATE `permissions` SET `feature_section` = 'Products', `is_dangerous` = false WHERE `id` IN (1, 2, 3, 211, 212, 213, 214);
UPDATE `permissions` SET `is_dangerous` = true WHERE `id` = 4; -- PRODUCTS_DELETE is dangerous

-- Operations permissions
UPDATE `permissions` SET `feature_section` = 'Operations', `is_dangerous` = false WHERE `id` IN (10, 11, 12, 13, 14);

-- Warehouse Access permissions
UPDATE `permissions` SET `feature_section` = 'Warehouse Access', `is_dangerous` = false WHERE `id` IN (
  218, 219, 220, 221, 222,  -- View permissions
  223, 224, 225, 226, 227,  -- Orders view
  228, 229, 230, 231, 232,  -- Inventory edit
  233, 234, 235, 236, 237   -- Orders edit
);

-- Website Orders permissions
UPDATE `permissions` SET `feature_section` = 'Website Orders', `is_dangerous` = false WHERE `id` IN (
  238, 239, 240, 241, 242, 243
);

-- Tickets permissions
UPDATE `permissions` SET `feature_section` = 'Tickets', `is_dangerous` = false WHERE `id` IN (250, 251, 252, 253);

-- Set permission levels (1 = basic, 2 = intermediate, 3 = advanced)
UPDATE `permissions` SET `permission_level` = 1 WHERE `name` LIKE '%_VIEW';
UPDATE `permissions` SET `permission_level` = 2 WHERE `name` LIKE '%_EDIT' OR `name` LIKE '%_CREATE';
UPDATE `permissions` SET `permission_level` = 3 WHERE `name` LIKE '%_DELETE' OR `name` LIKE '%_MANAGEMENT' OR `name` LIKE '%_BULK%';
