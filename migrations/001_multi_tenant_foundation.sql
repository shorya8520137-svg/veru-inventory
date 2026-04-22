-- ============================================================
-- MIGRATION 001: Multi-Tenant Foundation
-- Run: mysql -h127.0.0.1 -uinventory_user -p'StrongPass@123' inventory_db < migrations/001_multi_tenant_foundation.sql
-- ============================================================

-- ── STEP 1: Create tenants table ──
CREATE TABLE IF NOT EXISTS tenants (
    id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,   -- e.g. 'giftgala', 'client2'
    plan            ENUM('starter','pro','enterprise') DEFAULT 'starter',
    shiprocket_token TEXT DEFAULT NULL,             -- per-tenant Shiprocket token
    shiprocket_token_expiry DATETIME DEFAULT NULL,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tenant (your current client)
INSERT IGNORE INTO tenants (id, name, slug, plan) VALUES (1, 'Gift Gala', 'giftgala', 'pro');

-- ── STEP 2: Add tenant_id to all core tables ──

-- dispatch_product (product catalog)
ALTER TABLE dispatch_product
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER p_id,
    ADD INDEX IF NOT EXISTS idx_tenant (tenant_id);

-- inventory (live stock)
ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id,
    ADD INDEX IF NOT EXISTS idx_tenant_inv (tenant_id);

-- stock_batches (FIFO batches)
ALTER TABLE stock_batches
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id,
    ADD INDEX IF NOT EXISTS idx_tenant_sb (tenant_id);

-- inventory_ledger_base (audit trail)
ALTER TABLE inventory_ledger_base
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;

-- warehouse_dispatch (dispatch records)
ALTER TABLE warehouse_dispatch
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id,
    ADD COLUMN IF NOT EXISTS customer_phone  VARCHAR(20)  DEFAULT NULL AFTER customer,
    ADD COLUMN IF NOT EXISTS customer_email  VARCHAR(255) DEFAULT NULL AFTER customer_phone,
    ADD COLUMN IF NOT EXISTS customer_address TEXT        DEFAULT NULL AFTER customer_email,
    ADD COLUMN IF NOT EXISTS customer_city   VARCHAR(100) DEFAULT NULL AFTER customer_address,
    ADD COLUMN IF NOT EXISTS customer_state  VARCHAR(100) DEFAULT NULL AFTER customer_city,
    ADD COLUMN IF NOT EXISTS customer_pincode VARCHAR(10) DEFAULT NULL AFTER customer_state,
    ADD COLUMN IF NOT EXISTS shiprocket_order_id    VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS shiprocket_shipment_id VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS awb_code        VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS tracking_url    TEXT         DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS qty_reserved    INT UNSIGNED DEFAULT 0,
    ADD INDEX IF NOT EXISTS idx_tenant_wd (tenant_id);

-- warehouse_dispatch_items
ALTER TABLE warehouse_dispatch_items
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;

-- inventory_daily_snapshot
ALTER TABLE inventory_daily_snapshot
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;

-- inventory_snapshots
ALTER TABLE inventory_snapshots
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;

-- product_categories
ALTER TABLE product_categories
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id;

-- dispatch_warehouse
ALTER TABLE dispatch_warehouse
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1;

-- ── STEP 3: Add AWB unique constraint ──
ALTER TABLE warehouse_dispatch
    ADD COLUMN IF NOT EXISTS version INT UNSIGNED DEFAULT 0;

-- ── STEP 4: Add qty_reserved to inventory for race condition prevention ──
ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS qty_reserved INT UNSIGNED DEFAULT 0 AFTER stock;

-- ── STEP 5: Users table — add tenant_id ──
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS tenant_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER id,
    ADD INDEX IF NOT EXISTS idx_tenant_users (tenant_id);

-- ── STEP 6: Verify ──
SELECT 'Migration 001 complete' AS status;
SELECT TABLE_NAME, COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'inventory_db'
  AND COLUMN_NAME = 'tenant_id'
ORDER BY TABLE_NAME;
