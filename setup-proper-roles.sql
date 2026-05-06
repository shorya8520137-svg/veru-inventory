-- Setup Proper Roles with Appropriate Permissions
-- Based on Permissions Redesign Specification

-- First, let's see what permissions we have
SELECT id, name, feature_section, is_dangerous, permission_level 
FROM permissions 
ORDER BY feature_section, name;

-- Create/Update roles with proper permission sets

-- 1. WAREHOUSE MANAGER ROLE
-- Should have: Warehouse + Inventory + Operations permissions
INSERT INTO roles (name, display_name, description, color, created_at, updated_at)
VALUES (
  'warehouse_manager',
  'Warehouse Manager',
  'Full access to warehouse operations, inventory management, and operational tasks',
  '#10B981',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  display_name = 'Warehouse Manager',
  description = 'Full access to warehouse operations, inventory management, and operational tasks',
  color = '#10B981';

-- Get the role ID
SET @warehouse_manager_id = (SELECT id FROM roles WHERE name = 'warehouse_manager');

-- Assign permissions to Warehouse Manager
-- Inventory permissions (5, 6, 215, 217)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(@warehouse_manager_id, 5),   -- INVENTORY_VIEW
(@warehouse_manager_id, 6),   -- INVENTORY_EDIT
(@warehouse_manager_id, 215), -- INVENTORY_TIMELINE
(@warehouse_manager_id, 217), -- EXPORT_INVENTORY

-- Operations permissions (10, 11, 12, 13, 14)
(@warehouse_manager_id, 10),  -- OPERATIONS_DISPATCH
(@warehouse_manager_id, 11),  -- OPERATIONS_SELF_TRANSFER
(@warehouse_manager_id, 12),  -- OPERATIONS_DAMAGE_RECOVERY
(@warehouse_manager_id, 13),  -- OPERATIONS_RETURNS
(@warehouse_manager_id, 14),  -- OPERATIONS_BULK_UPLOAD

-- Warehouse Access permissions (218-237)
(@warehouse_manager_id, 218), -- WAREHOUSE_GGM_VIEW
(@warehouse_manager_id, 219), -- WAREHOUSE_BLR_VIEW
(@warehouse_manager_id, 220), -- WAREHOUSE_MUM_VIEW
(@warehouse_manager_id, 221), -- WAREHOUSE_AMD_VIEW
(@warehouse_manager_id, 222), -- WAREHOUSE_HYD_VIEW
(@warehouse_manager_id, 223), -- WAREHOUSE_GGM_ORDERS_VIEW
(@warehouse_manager_id, 224), -- WAREHOUSE_BLR_ORDERS_VIEW
(@warehouse_manager_id, 225), -- WAREHOUSE_MUM_ORDERS_VIEW
(@warehouse_manager_id, 226), -- WAREHOUSE_AMD_ORDERS_VIEW
(@warehouse_manager_id, 227), -- WAREHOUSE_HYD_ORDERS_VIEW
(@warehouse_manager_id, 228), -- WAREHOUSE_GGM_INVENTORY_EDIT
(@warehouse_manager_id, 229), -- WAREHOUSE_BLR_INVENTORY_EDIT
(@warehouse_manager_id, 230), -- WAREHOUSE_MUM_INVENTORY_EDIT
(@warehouse_manager_id, 231), -- WAREHOUSE_AMD_INVENTORY_EDIT
(@warehouse_manager_id, 232), -- WAREHOUSE_HYD_INVENTORY_EDIT
(@warehouse_manager_id, 233), -- WAREHOUSE_GGM_ORDERS_EDIT
(@warehouse_manager_id, 234), -- WAREHOUSE_BLR_ORDERS_EDIT
(@warehouse_manager_id, 235), -- WAREHOUSE_MUM_ORDERS_EDIT
(@warehouse_manager_id, 236), -- WAREHOUSE_AMD_ORDERS_EDIT
(@warehouse_manager_id, 237); -- WAREHOUSE_HYD_ORDERS_EDIT

-- 2. INVENTORY STAFF ROLE
-- Should have: Inventory view/edit + transfers
INSERT INTO roles (name, display_name, description, color, created_at, updated_at)
VALUES (
  'inventory_staff',
  'Inventory Staff',
  'View and edit inventory, manage transfers',
  '#3B82F6',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  display_name = 'Inventory Staff',
  description = 'View and edit inventory, manage transfers',
  color = '#3B82F6';

SET @inventory_staff_id = (SELECT id FROM roles WHERE name = 'inventory_staff');

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(@inventory_staff_id, 5),   -- INVENTORY_VIEW
(@inventory_staff_id, 6),   -- INVENTORY_EDIT
(@inventory_staff_id, 215), -- INVENTORY_TIMELINE
(@inventory_staff_id, 11);  -- OPERATIONS_SELF_TRANSFER

-- 3. ORDER PROCESSOR ROLE
-- Should have: Orders + Dispatch + Tracking
INSERT INTO roles (name, display_name, description, color, created_at, updated_at)
VALUES (
  'order_processor',
  'Order Processor',
  'Process orders, manage dispatch, and track shipments',
  '#8B5CF6',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  display_name = 'Order Processor',
  description = 'Process orders, manage dispatch, and track shipments',
  color = '#8B5CF6';

SET @order_processor_id = (SELECT id FROM roles WHERE name = 'order_processor');

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(@order_processor_id, 7),   -- ORDERS_VIEW
(@order_processor_id, 8),   -- ORDERS_EDIT
(@order_processor_id, 9),   -- ORDERS_DELETE
(@order_processor_id, 10),  -- OPERATIONS_DISPATCH
(@order_processor_id, 238), -- WEBSITE_ORDERS_VIEW
(@order_processor_id, 239), -- WEBSITE_ORDERS_EDIT
(@order_processor_id, 240), -- WEBSITE_ORDERS_DELETE
(@order_processor_id, 241), -- WEBSITE_ORDERS_EXPORT
(@order_processor_id, 242), -- WEBSITE_ORDERS_BULK_UPDATE
(@order_processor_id, 243); -- WEBSITE_ORDERS_REFUND

-- 4. PRODUCT MANAGER ROLE
-- Should have: Products + Categories + Bulk Import
INSERT INTO roles (name, display_name, description, color, created_at, updated_at)
VALUES (
  'product_manager',
  'Product Manager',
  'Manage products, categories, and bulk operations',
  '#F59E0B',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  display_name = 'Product Manager',
  description = 'Manage products, categories, and bulk operations',
  color = '#F59E0B';

SET @product_manager_id = (SELECT id FROM roles WHERE name = 'product_manager');

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(@product_manager_id, 1),   -- PRODUCTS_VIEW
(@product_manager_id, 2),   -- PRODUCTS_CREATE
(@product_manager_id, 3),   -- PRODUCTS_EDIT
(@product_manager_id, 4),   -- PRODUCTS_DELETE (dangerous)
(@product_manager_id, 211), -- PRODUCTS_CATEGORIES_VIEW
(@product_manager_id, 212), -- PRODUCTS_CATEGORIES_CREATE
(@product_manager_id, 213), -- PRODUCTS_CATEGORIES_EDIT
(@product_manager_id, 214), -- PRODUCTS_CATEGORIES_DELETE
(@product_manager_id, 14);  -- OPERATIONS_BULK_UPLOAD

-- 5. BILLING SPECIALIST ROLE
-- Should have: Billing + Store Inventory
INSERT INTO roles (name, display_name, description, color, created_at, updated_at)
VALUES (
  'billing_specialist',
  'Billing Specialist',
  'Manage billing and store inventory',
  '#EC4899',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  display_name = 'Billing Specialist',
  description = 'Manage billing and store inventory',
  color = '#EC4899';

SET @billing_specialist_id = (SELECT id FROM roles WHERE name = 'billing_specialist');

-- Note: Add billing permissions when they exist in the database
-- For now, adding inventory view permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(@billing_specialist_id, 5),   -- INVENTORY_VIEW
(@billing_specialist_id, 215); -- INVENTORY_TIMELINE

-- 6. READ-ONLY AUDITOR ROLE
-- Should have: View-only permissions + Audit Logs
INSERT INTO roles (name, display_name, description, color, created_at, updated_at)
VALUES (
  'auditor',
  'Read-Only Auditor',
  'View-only access to all data and audit logs',
  '#6B7280',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  display_name = 'Read-Only Auditor',
  description = 'View-only access to all data and audit logs',
  color = '#6B7280';

SET @auditor_id = (SELECT id FROM roles WHERE name = 'auditor');

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(@auditor_id, 1),   -- PRODUCTS_VIEW
(@auditor_id, 5),   -- INVENTORY_VIEW
(@auditor_id, 7),   -- ORDERS_VIEW
(@auditor_id, 211), -- PRODUCTS_CATEGORIES_VIEW
(@auditor_id, 215), -- INVENTORY_TIMELINE
(@auditor_id, 217), -- EXPORT_INVENTORY
(@auditor_id, 218), -- WAREHOUSE_GGM_VIEW
(@auditor_id, 219), -- WAREHOUSE_BLR_VIEW
(@auditor_id, 220), -- WAREHOUSE_MUM_VIEW
(@auditor_id, 221), -- WAREHOUSE_AMD_VIEW
(@auditor_id, 222), -- WAREHOUSE_HYD_VIEW
(@auditor_id, 238), -- WEBSITE_ORDERS_VIEW
(@auditor_id, 250), -- TICKETS_VIEW
(@auditor_id, 251); -- TICKETS_EDIT

-- 7. CUSTOMER SUPPORT ROLE
-- Should have: Tickets + Orders View + Website Orders
INSERT INTO roles (name, display_name, description, color, created_at, updated_at)
VALUES (
  'customer_support',
  'Customer Support',
  'Handle customer tickets and view orders',
  '#14B8A6',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  display_name = 'Customer Support',
  description = 'Handle customer tickets and view orders',
  color = '#14B8A6';

SET @customer_support_id = (SELECT id FROM roles WHERE name = 'customer_support');

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(@customer_support_id, 7),   -- ORDERS_VIEW
(@customer_support_id, 238), -- WEBSITE_ORDERS_VIEW
(@customer_support_id, 239), -- WEBSITE_ORDERS_EDIT
(@customer_support_id, 243), -- WEBSITE_ORDERS_REFUND
(@customer_support_id, 250), -- TICKETS_VIEW
(@customer_support_id, 251), -- TICKETS_EDIT
(@customer_support_id, 252), -- TICKETS_CREATE
(@customer_support_id, 253); -- TICKETS_DELETE

-- Verify the setup
SELECT 
  r.id,
  r.name,
  r.display_name,
  r.description,
  COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name IN ('warehouse_manager', 'inventory_staff', 'order_processor', 'product_manager', 'billing_specialist', 'auditor', 'customer_support')
GROUP BY r.id, r.name, r.display_name, r.description
ORDER BY r.name;

-- Show permissions for each role
SELECT 
  r.name as role_name,
  r.display_name,
  p.name as permission_name,
  p.feature_section,
  p.is_dangerous
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('warehouse_manager', 'inventory_staff', 'order_processor', 'product_manager', 'billing_specialist', 'auditor', 'customer_support')
ORDER BY r.name, p.feature_section, p.name;
