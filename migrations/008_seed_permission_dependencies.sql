-- Migration: Seed permission dependencies
-- Task: 1.8
-- Description: Define prerequisite permission relationships

-- Products: Edit requires View
INSERT INTO `permission_dependencies` (`permission_id`, `required_permission_id`) VALUES
(3, 1),  -- PRODUCTS_EDIT requires PRODUCTS_VIEW
(4, 1),  -- PRODUCTS_DELETE requires PRODUCTS_VIEW
(2, 1),  -- PRODUCTS_CREATE requires PRODUCTS_VIEW

-- Inventory: Edit requires View
(6, 5),  -- INVENTORY_EDIT requires INVENTORY_VIEW
(217, 5), -- INVENTORY_EXPORT requires INVENTORY_VIEW
(215, 5), -- INVENTORY_TIMELINE requires INVENTORY_VIEW

-- Orders: Edit/Create requires View
(8, 7),  -- ORDERS_CREATE requires ORDERS_VIEW
(9, 7),  -- ORDERS_EDIT requires ORDERS_VIEW

-- Operations: All require inventory view
(10, 5), -- OPERATIONS_DISPATCH requires INVENTORY_VIEW
(11, 5), -- OPERATIONS_DAMAGE requires INVENTORY_VIEW
(12, 5), -- OPERATIONS_RETURN requires INVENTORY_VIEW
(13, 5), -- OPERATIONS_BULK requires INVENTORY_VIEW
(14, 5), -- OPERATIONS_SELF_TRANSFER requires INVENTORY_VIEW

-- System: Role management requires user management
(16, 15), -- SYSTEM_ROLE_MANAGEMENT requires SYSTEM_USER_MANAGEMENT

-- Product operations require product view
(211, 1), -- PRODUCTS_CATEGORIES requires PRODUCTS_VIEW
(212, 1), -- PRODUCTS_BULK_IMPORT requires PRODUCTS_VIEW
(213, 1), -- PRODUCTS_EXPORT requires PRODUCTS_VIEW
(214, 1), -- PRODUCTS_SELF_TRANSFER requires PRODUCTS_VIEW

-- Warehouse edit requires warehouse view
(228, 218), -- INVENTORY_EDIT_GGM_WH requires INVENTORY_VIEW_GGM_WH
(229, 219), -- INVENTORY_EDIT_BLR_WH requires INVENTORY_VIEW_BLR_WH
(230, 220), -- INVENTORY_EDIT_MUM_WH requires INVENTORY_VIEW_MUM_WH
(231, 221), -- INVENTORY_EDIT_AMD_WH requires INVENTORY_VIEW_AMD_WH
(232, 222), -- INVENTORY_EDIT_HYD_WH requires INVENTORY_VIEW_HYD_WH

(233, 223), -- ORDERS_EDIT_GGM_WH requires ORDERS_VIEW_GGM_WH
(234, 224), -- ORDERS_EDIT_BLR_WH requires ORDERS_VIEW_BLR_WH
(235, 225), -- ORDERS_EDIT_MUM_WH requires ORDERS_VIEW_MUM_WH
(236, 226), -- ORDERS_EDIT_AMD_WH requires ORDERS_VIEW_AMD_WH
(237, 227), -- ORDERS_EDIT_HYD_WH requires ORDERS_VIEW_HYD_WH

-- Tickets: Edit/Manage requires View
(252, 251), -- TICKETS_CREATE requires TICKETS_VIEW
(253, 251), -- TICKETS_EDIT requires TICKETS_VIEW
(250, 251); -- TICKETS_MANAGE requires TICKETS_VIEW
