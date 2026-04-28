-- =====================================================
-- STEP 1: CLEAR ALL PRODUCT & INVENTORY DATA
-- Run this first before inserting fresh data
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Clear timeline / ledger
TRUNCATE TABLE inventory_ledger_base;

-- Clear stock
TRUNCATE TABLE stock_batches;

-- Clear product catalog
TRUNCATE TABLE dispatch_product;
TRUNCATE TABLE product_categories;

-- Clear damage/recovery logs
TRUNCATE TABLE damage_recovery_log;

-- Clear returns
TRUNCATE TABLE returns;
TRUNCATE TABLE returns_main;

-- Clear self transfers
TRUNCATE TABLE self_transfer;
TRUNCATE TABLE self_transfer_items;

-- Clear store inventory
TRUNCATE TABLE store_inventory;
TRUNCATE TABLE store_inventory_logs;
TRUNCATE TABLE store_timeline;

-- Clear dispatch
TRUNCATE TABLE dispatch_delivery;

-- Clear inventory snapshots
TRUNCATE TABLE inventory_daily_snapshot;
TRUNCATE TABLE inventory_snapshots;
TRUNCATE TABLE inventory_adjustments;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'All data cleared successfully!' AS status;
