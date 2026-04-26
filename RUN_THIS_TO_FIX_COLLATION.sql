-- ============================================================================
-- RUN THIS TO FIX COLLATION ERROR
-- Copy and paste these commands one by one into your MySQL terminal
-- ============================================================================

-- STEP 1: Check the problem
-- ============================================================================
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('store_inventory', 'stores')
  AND COLUMN_NAME = 'store_code';

-- You should see different collations above
-- Now fix it:

-- STEP 2: Fix the collation mismatch
-- ============================================================================
ALTER TABLE store_inventory 
MODIFY COLUMN store_code VARCHAR(50) 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_0900_ai_ci 
NULL;

-- STEP 3: Verify the fix
-- ============================================================================
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('store_inventory', 'stores')
  AND COLUMN_NAME = 'store_code';

-- Both should now show utf8mb4_0900_ai_ci

-- STEP 4: Test the JOIN (should work now!)
-- ============================================================================
SELECT 
    si.store_code,
    s.store_name,
    s.city,
    COUNT(*) as product_count,
    SUM(si.stock) as total_stock
FROM store_inventory si
LEFT JOIN stores s ON si.store_code = s.store_code
GROUP BY si.store_code, s.store_name, s.city
ORDER BY si.store_code;

-- STEP 5: See detailed product list with store names
-- ============================================================================
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
LEFT JOIN stores s ON si.store_code = s.store_code
ORDER BY si.store_code, si.product_name;

-- STEP 6: Find stores with NO inventory
-- ============================================================================
SELECT 
    s.store_code,
    s.store_name,
    s.city,
    'No inventory' as status
FROM stores s
LEFT JOIN store_inventory si ON s.store_code = si.store_code
WHERE si.id IS NULL
ORDER BY s.store_code;

-- STEP 7: Find stores WITH inventory
-- ============================================================================
SELECT 
    s.store_code,
    s.store_name,
    s.city,
    COUNT(si.id) as products,
    SUM(si.stock) as total_stock
FROM stores s
INNER JOIN store_inventory si ON s.store_code = si.store_code
GROUP BY s.store_code, s.store_name, s.city
ORDER BY s.store_code;

-- ============================================================================
-- DONE! Your collation is now fixed and all queries should work
-- ============================================================================
