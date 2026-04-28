-- =====================================================
-- STEP 2: INSERT FRESH TEST PRODUCT + STOCK
-- Run this AFTER STEP1_CLEAR_ALL_DATA.sql
-- =====================================================

-- ── 1. Insert product category ──────────────────────
INSERT INTO product_categories (name, display_name, description, is_active)
VALUES ('Test Category', 'Test Category', 'Test category for damage testing', 1);

-- ── 2. Insert product into dispatch_product (catalog) ──
-- This is what the Damage modal searches
INSERT INTO dispatch_product (
    product_name,
    product_variant,
    barcode,
    category_id,
    price,
    is_active
) VALUES (
    'Test Product Alpha',
    'Standard',
    'TEST001234567890',
    LAST_INSERT_ID(),
    100.00,
    1
);

-- ── 3. Insert stock into stock_batches (inventory) ──
-- BARCODE MUST MATCH dispatch_product above
INSERT INTO stock_batches (
    product_name,
    barcode,
    variant,
    warehouse,
    source_type,
    qty_initial,
    qty_available,
    unit_cost,
    status
) VALUES (
    'Test Product Alpha',
    'TEST001234567890',
    'Standard',
    'GGM_WH',
    'OPENING',
    100,
    100,
    0.00,
    'active'
);

-- ── 4. Insert opening ledger entry ──────────────────
INSERT INTO inventory_ledger_base (
    event_time,
    movement_type,
    barcode,
    product_name,
    location_code,
    qty,
    direction,
    reference
) VALUES (
    NOW(),
    'OPENING',
    'TEST001234567890',
    'Test Product Alpha',
    'GGM_WH',
    100,
    'IN',
    'OPENING_TEST001234567890'
);

-- ── 5. Verify ───────────────────────────────────────
SELECT '=== CATALOG (dispatch_product) ===' AS check1;
SELECT product_name, barcode, is_active FROM dispatch_product WHERE barcode = 'TEST001234567890';

SELECT '=== STOCK (stock_batches) ===' AS check2;
SELECT product_name, barcode, warehouse, qty_available, status FROM stock_batches WHERE barcode = 'TEST001234567890';

SELECT '=== TIMELINE (inventory_ledger_base) ===' AS check3;
SELECT movement_type, barcode, product_name, location_code, qty, direction FROM inventory_ledger_base WHERE barcode = 'TEST001234567890';

SELECT '=== READY TO TEST ===' AS final_status;
SELECT 'Product : Test Product Alpha' AS info1;
SELECT 'Barcode  : TEST001234567890'  AS info2;
SELECT 'Warehouse: GGM_WH'            AS info3;
SELECT 'Stock    : 100 units'         AS info4;
