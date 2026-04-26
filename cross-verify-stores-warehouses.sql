-- ============================================================================
-- CROSS VERIFY STORES AND WAREHOUSES
-- Complete diagnostic queries to check all store/warehouse data
-- ============================================================================

-- 1. CHECK ALL STORES
-- See all stores with their codes
SELECT 
    id,
    store_code,
    store_name,
    store_type,
    city,
    state,
    created_at
FROM stores
ORDER BY id;

-- 2. CHECK ALL WAREHOUSES
-- See all warehouses with their codes
SELECT 
    id,
    warehouse_code,
    warehouse_name,
    city,
    state,
    created_at
FROM warehouses
ORDER BY id;

-- 3. CHECK STORE INVENTORY DISTRIBUTION
-- See how many products per store_code
SELECT 
    COALESCE(store_code, 'NULL') as store_code,
    COUNT(*) as product_count,
    SUM(stock) as total_stock
FROM store_inventory
GROUP BY store_code
ORDER BY store_code;

-- 4. CHECK STORE INVENTORY DETAILS
-- See all products with their store codes
SELECT 
    id,
    store_code,
    product_name,
    barcode,
    stock,
    price,
    created_at
FROM store_inventory
ORDER BY store_code, product_name;

-- 5. CROSS-CHECK: Products vs Stores
-- Find products with store_codes that don't exist in stores table
SELECT 
    si.id,
    si.store_code as inventory_store_code,
    si.product_name,
    si.barcode,
    s.store_code as actual_store_code,
    s.store_name
FROM store_inventory si
LEFT JOIN stores s ON si.store_code = s.store_code
WHERE si.store_code IS NOT NULL
ORDER BY si.store_code;

-- 6. FIND ORPHANED PRODUCTS
-- Products with store_code that doesn't exist in stores table
SELECT 
    si.id,
    si.store_code,
    si.product_name,
    si.barcode,
    'Store code not found in stores table' as issue
FROM store_inventory si
LEFT JOIN stores s ON si.store_code = s.store_code
WHERE si.store_code IS NOT NULL 
  AND s.store_code IS NULL;

-- 7. FIND NULL STORE CODES
-- Products without any store code
SELECT 
    id,
    product_name,
    barcode,
    stock,
    'No store code assigned' as issue
FROM store_inventory
WHERE store_code IS NULL;

-- 8. SUMMARY REPORT
-- Overall system status
SELECT 
    'Total Stores' as metric,
    COUNT(*) as count
FROM stores
UNION ALL
SELECT 
    'Total Warehouses' as metric,
    COUNT(*) as count
FROM warehouses
UNION ALL
SELECT 
    'Total Products in Store Inventory' as metric,
    COUNT(*) as count
FROM store_inventory
UNION ALL
SELECT 
    'Products with NULL store_code' as metric,
    COUNT(*) as count
FROM store_inventory
WHERE store_code IS NULL
UNION ALL
SELECT 
    'Products with valid store_code' as metric,
    COUNT(*) as count
FROM store_inventory
WHERE store_code IS NOT NULL;

-- ============================================================================
-- RECOMMENDED FIXES
-- ============================================================================

-- FIX 1: If you have one main store, set all NULL products to it
-- First, check what store codes you have:
SELECT store_code, store_name FROM stores;

-- Then update (replace 'YOUR_STORE_CODE' with actual code from above):
-- UPDATE store_inventory 
-- SET store_code = 'YOUR_STORE_CODE' 
-- WHERE store_code IS NULL;

-- FIX 2: If you want to distribute products across stores
-- You'll need to manually assign each product to the correct store
-- Example:
-- UPDATE store_inventory 
-- SET store_code = 'GGM_NH48' 
-- WHERE barcode = '199627757257';

-- FIX 3: Set all products to first store in stores table
-- UPDATE store_inventory si
-- SET si.store_code = (SELECT store_code FROM stores ORDER BY id LIMIT 1)
-- WHERE si.store_code IS NULL;
