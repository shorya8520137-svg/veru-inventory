-- Migration: Seed built-in permission templates
-- Task: 1.7
-- Description: Insert 7 built-in templates

INSERT INTO `permission_templates` (`name`, `description`, `permissions_json`, `is_builtin`) VALUES
(
  'Super Admin',
  'Full system access with all permissions',
  JSON_ARRAY(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,250,251,252,253),
  true
),
(
  'Warehouse Manager',
  'Warehouse operations, inventory management, and staff supervision',
  JSON_ARRAY(5,6,10,11,12,13,14,215,217,218,219,220,221,222,228,229,230,231,232),
  true
),
(
  'Inventory Staff',
  'View and edit inventory, process transfers',
  JSON_ARRAY(1,5,6,215,217,218,219,220,221,222),
  true
),
(
  'Order Processor',
  'View and manage orders, dispatch operations, tracking',
  JSON_ARRAY(1,5,7,8,9,10,223,224,225,226,227),
  true
),
(
  'Product Manager',
  'Manage products, categories, bulk import/export',
  JSON_ARRAY(1,2,3,4,211,212,213,214),
  true
),
(
  'Billing Specialist',
  'View inventory and manage billing operations',
  JSON_ARRAY(1,5,7,217),
  true
),
(
  'Read-Only Auditor',
  'View-only access to all data and audit logs',
  JSON_ARRAY(1,5,7,17,218,219,220,221,222,223,224,225,226,227,238,239,240,241,242,243,251),
  true
);
