-- ============================================================================
-- VERIFY STORES AND INVENTORY WITHOUT JOIN (WORKAROUND FOR COLLATION ERROR)
-- Use these queries until collation is fixed
-- ============================================================================

-- 1. Check all stores
-- ============================================================================
SELECT 
    store_code,
    store_name,
    city,
    state,
    is_active
FROM stores
ORDER BY city, store_name;

-- 2. Check all products in store_inventory
-- ============================================================================
SELECT 
    id,
    store_code,
    product_name,
    barcode,
    stock,
    price,
    (stock * price) as total_value
FROM store_inventory
ORDER BY store_code, product_name;

-- 3. Count products per store_code (without JOIN)
-- ============================================================================
SELECT 
    COALESCE(store_code, 'NULL') as store_code,
    COUNT(*) as product_count,
    SUM(stock) as total_stock,
    SUM(stock * price) as total_value
FROM store_inventory
GROUP BY store_code
ORDER BY store_code;

-- 4. List all store codes from stores table
-- ============================================================================
SELECT 
    'Available Store Codes:' as info,
    GROUP_CONCAT(store_code ORDER BY store_code SEPARATOR ', ') as store_codes
FROM stores;

-- 5. List all store codes used in inventory
-- ============================================================================
SELECT 
    'Store Codes in Inventory:' as info,
    GROUP_CONCAT(DISTINCT store_code ORDER BY store_code SEPARATOR ', ') as store_codes
FROM store_inventory
WHERE store_code IS NOT NULL;

-- 6. Find store codes in inventory that might not exist in stores
-- (Manual comparison needed due to collation issue)
-- ============================================================================
SELECT DISTINCT
    store_code as inventory_store_codes
FROM store_inventory
WHERE store_code IS NOT NULL
ORDER BY store_code;

-- Compare with:
SELECT DISTINCT
    store_code as actual_store_codes
FROM stores
ORDER BY store_code;

-- 7. Check for NULL store codes
-- ============================================================================
SELECT 
    id,
    product_name,
    barcode,
    stock,
    'Missing store_code' as issue
FROM store_inventory
WHERE store_code IS NULL;

-- 8. Summary report (without JOIN)
-- ============================================================================
SELECT 'Total Stores' as metric, COUNT(*) as count FROM stores
UNION ALL
SELECT 'Total Products in Store Inventory', COUNT(*) FROM store_inventory
UNION ALL
SELECT 'Products with store_code assigned', COUNT(*) FROM store_inventory WHERE store_code IS NOT NULL
UNION ALL
SELECT 'Products with NULL store_code', COUNT(*) FROM store_inventory WHERE store_code IS NULL;

-- 9. Detailed product list with store info (using COLLATE to force match)
-- ============================================================================
-- This forces both sides to use the same collation for comparison
SELECT 
    si.id,
    si.store_code,
    s.store_name,
    s.city,
    si.product_name,
    si.barcode,
    si.stock,
    si.price
FROM store_inventory si
LEFT JOIN stores s ON si.store_code COLLATE utf8mb4_0900_ai_ci = s.store_code COLLATE utf8mb4_0900_ai_ci
ORDER BY si.store_code, si.product_name;

-- 10. Store distribution with COLLATE workaround
-- ============================================================================
SELECT 
    si.store_code,
    s.store_name,
    s.city,
    COUNT(*) as product_count,
    SUM(si.stock) as total_stock,
    SUM(si.stock * si.price) as total_value
FROM store_inventory si
LEFT JOIN stores s ON si.store_code COLLATE utf8mb4_0900_ai_ci = s.store_code COLLATE utf8mb4_0900_ai_ci
GROUP BY si.store_code, s.store_name, s.city
ORDER BY si.store_code;

-- 11. Find stores with NO inventory (using COLLATE)
-- ============================================================================
SELECT 
    s.store_code,
    s.store_name,
    s.city,
    'No inventory' as status
FROM stores s
LEFT JOIN store_inventory si ON s.store_code COLLATE utf8mb4_0900_ai_ci = si.store_code COLLATE utf8mb4_0900_ai_ci
WHERE si.id IS NULL
ORDER BY s.store_code;

-- 12. Find stores WITH inventory (using COLLATE)
-- ============================================================================
SELECT 
    s.store_code,
    s.store_name,
    s.city,
    COUNT(si.id) as products,
    SUM(si.stock) as total_stock
FROM stores s
INNER JOIN store_inventory si ON s.store_code COLLATE utf8mb4_0900_ai_ci = si.store_code COLLATE utf8mb4_0900_ai_ci
GROUP BY s.store_code, s.store_name, s.city
ORDER BY s.store_code;

-- ============================================================================
-- CURRENT STATE CHECK (Based on your updates)
-- ============================================================================

-- You updated:
-- - Product 361313801009 -> GGM_MGF_MALL
-- - Product 199627757257 -> GGM_ROSHANPURA

-- Verify these updates:
SELECT 
    barcode,
    store_code,
    product_name,
    stock,
    CASE 
        WHEN barcode = '361313801009' AND store_code = 'GGM_MGF_MALL' THEN '✓ Correct'
        WHEN barcode = '199627757257' AND store_code = 'GGM_ROSHANPURA' THEN '✓ Correct'
        ELSE '✗ Check this'
    END as status
FROM store_inventory
WHERE barcode IN ('361313801009', '199627757257');
