-- ============================================================
-- MIGRATION 001: Multi-Tenant Foundation (MySQL 5.7+ compatible)
-- Run: mysql -h127.0.0.1 -uinventory_user -p'StrongPass@123' inventory_db < migrations/001_multi_tenant_foundation.sql
-- ============================================================

-- ── STEP 1: Create tenants table ──
CREATE TABLE IF NOT EXISTS tenants (
    id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    plan            ENUM('starter','pro','enterprise') DEFAULT 'starter',
    shiprocket_token TEXT DEFAULT NULL,
    shiprocket_token_expiry DATETIME DEFAULT NULL,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO tenants (id, name, slug, plan) VALUES (1, 'Gift Gala', 'giftgala', 'pro');

-- ── STEP 2: Add tenant_id to core tables (safe — checks before adding) ──

-- dispatch_product
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='dispatch_product' AND COLUMN_NAME='tenant_id');
SET @sql = IF(@col=0, 'ALTER TABLE dispatch_product ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT "dispatch_product.tenant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- inventory
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='inventory' AND COLUMN_NAME='tenant_id');
SET @sql = IF(@col=0, 'ALTER TABLE inventory ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT "inventory.tenant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- inventory: qty_reserved
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='inventory' AND COLUMN_NAME='qty_reserved');
SET @sql = IF(@col=0, 'ALTER TABLE inventory ADD COLUMN qty_reserved INT UNSIGNED DEFAULT 0', 'SELECT "inventory.qty_reserved exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- stock_batches
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='stock_batches' AND COLUMN_NAME='tenant_id');
SET @sql = IF(@col=0, 'ALTER TABLE stock_batches ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT "stock_batches.tenant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- inventory_ledger_base
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='inventory_ledger_base' AND COLUMN_NAME='tenant_id');
SET @sql = IF(@col=0, 'ALTER TABLE inventory_ledger_base ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT "inventory_ledger_base.tenant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: tenant_id
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='tenant_id');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT "warehouse_dispatch.tenant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: customer_phone
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='customer_phone');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN customer_phone VARCHAR(20) DEFAULT NULL', 'SELECT "customer_phone exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: customer_email
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='customer_email');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN customer_email VARCHAR(255) DEFAULT NULL', 'SELECT "customer_email exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: customer_address
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='customer_address');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN customer_address TEXT DEFAULT NULL', 'SELECT "customer_address exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: customer_city
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='customer_city');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN customer_city VARCHAR(100) DEFAULT NULL', 'SELECT "customer_city exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: customer_state
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='customer_state');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN customer_state VARCHAR(100) DEFAULT NULL', 'SELECT "customer_state exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: customer_pincode
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='customer_pincode');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN customer_pincode VARCHAR(10) DEFAULT NULL', 'SELECT "customer_pincode exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: shiprocket_order_id
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='shiprocket_order_id');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN shiprocket_order_id VARCHAR(100) DEFAULT NULL', 'SELECT "shiprocket_order_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: shiprocket_shipment_id
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='shiprocket_shipment_id');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN shiprocket_shipment_id VARCHAR(100) DEFAULT NULL', 'SELECT "shiprocket_shipment_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: awb_code
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='awb_code');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN awb_code VARCHAR(100) DEFAULT NULL', 'SELECT "awb_code exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: tracking_url
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='tracking_url');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN tracking_url TEXT DEFAULT NULL', 'SELECT "tracking_url exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch: version (optimistic locking)
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch' AND COLUMN_NAME='version');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch ADD COLUMN version INT UNSIGNED DEFAULT 0', 'SELECT "version exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- warehouse_dispatch_items: tenant_id
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warehouse_dispatch_items' AND COLUMN_NAME='tenant_id');
SET @sql = IF(@col=0, 'ALTER TABLE warehouse_dispatch_items ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT "dispatch_items.tenant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- inventory_daily_snapshot: tenant_id
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='inventory_daily_snapshot' AND COLUMN_NAME='tenant_id');
SET @sql = IF(@col=0, 'ALTER TABLE inventory_daily_snapshot ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT "snapshot.tenant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- product_categories: tenant_id
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='product_categories' AND COLUMN_NAME='tenant_id');
SET @sql = IF(@col=0, 'ALTER TABLE product_categories ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT "categories.tenant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- users: tenant_id
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='tenant_id');
SET @sql = IF(@col=0, 'ALTER TABLE users ADD COLUMN tenant_id INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT "users.tenant_id exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── STEP 3: Add indexes ──
ALTER TABLE warehouse_dispatch    ADD INDEX IF NOT EXISTS idx_tenant (tenant_id);
ALTER TABLE inventory             ADD INDEX IF NOT EXISTS idx_tenant_inv (tenant_id);
ALTER TABLE stock_batches         ADD INDEX IF NOT EXISTS idx_tenant_sb (tenant_id);
ALTER TABLE users                 ADD INDEX IF NOT EXISTS idx_tenant_users (tenant_id);

-- ── STEP 4: Verify ──
SELECT 'Migration 001 complete' AS status;
SELECT TABLE_NAME, COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'tenant_id'
ORDER BY TABLE_NAME;
