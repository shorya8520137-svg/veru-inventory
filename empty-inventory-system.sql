-- ============================================
-- EMPTY INVENTORY SYSTEM
-- Based on actual database tables found
-- WARNING: This action cannot be undone!
-- ============================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- EMPTY ALL INVENTORY-RELATED TABLES
-- ============================================

-- Main inventory table
TRUNCATE TABLE inventory;
SELECT 'inventory table emptied' AS status;

-- Inventory tracking tables
TRUNCATE TABLE inventory_adjustments;
SELECT 'inventory_adjustments table emptied' AS status;

TRUNCATE TABLE inventory_daily_snapshot;
SELECT 'inventory_daily_snapshot table emptied' AS status;

TRUNCATE TABLE inventory_ledger_base;
SELECT 'inventory_ledger_base table emptied' AS status;

TRUNCATE TABLE inventory_snapshots;
SELECT 'inventory_snapshots table emptied' AS status;

-- Self transfer tables
TRUNCATE TABLE self_transfer;
SELECT 'self_transfer table emptied' AS status;

TRUNCATE TABLE self_transfer_items;
SELECT 'self_transfer_items table emptied' AS status;

-- Stock management tables
TRUNCATE TABLE stock_batches;
SELECT 'stock_batches table emptied' AS status;

TRUNCATE TABLE stock_transactions;
SELECT 'stock_transactions table emptied' AS status;

-- Store inventory tables
TRUNCATE TABLE store_inventory;
SELECT 'store_inventory table emptied' AS status;

TRUNCATE TABLE store_inventory_logs;
SELECT 'store_inventory_logs table emptied' AS status;

TRUNCATE TABLE storeinventory;
SELECT 'storeinventory table emptied' AS status;

-- ============================================
-- RESET AUTO_INCREMENT VALUES
-- ============================================
ALTER TABLE inventory AUTO_INCREMENT = 1;
ALTER TABLE inventory_adjustments AUTO_INCREMENT = 1;
ALTER TABLE inventory_daily_snapshot AUTO_INCREMENT = 1;
ALTER TABLE inventory_ledger_base AUTO_INCREMENT = 1;
ALTER TABLE inventory_snapshots AUTO_INCREMENT = 1;
ALTER TABLE self_transfer AUTO_INCREMENT = 1;
ALTER TABLE self_transfer_items AUTO_INCREMENT = 1;
ALTER TABLE stock_batches AUTO_INCREMENT = 1;
ALTER TABLE stock_transactions AUTO_INCREMENT = 1;
ALTER TABLE store_inventory AUTO_INCREMENT = 1;
ALTER TABLE store_inventory_logs AUTO_INCREMENT = 1;
ALTER TABLE storeinventory AUTO_INCREMENT = 1;

SELECT 'Auto increment values reset' AS status;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICATION - Check row counts
-- ============================================
SELECT 
    (SELECT COUNT(*) FROM inventory) AS inventory_count,
    (SELECT COUNT(*) FROM inventory_adjustments) AS adjustments_count,
    (SELECT COUNT(*) FROM self_transfer) AS self_transfer_count,
    (SELECT COUNT(*) FROM stock_batches) AS stock_batches_count,
    (SELECT COUNT(*) FROM store_inventory) AS store_inventory_count;

SELECT '✅ All inventory-related tables have been emptied successfully!' AS final_status;
