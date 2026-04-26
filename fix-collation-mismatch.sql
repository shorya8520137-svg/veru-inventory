-- ============================================================================
-- FIX COLLATION MISMATCH ERROR
-- Error: Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT) and 
--        (utf8mb4_0900_ai_ci,IMPLICIT) for operation '='
-- ============================================================================

-- STEP 1: Check current collations
-- ============================================================================

-- Check store_inventory.store_code collation
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME,
    CHARACTER_SET_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'store_inventory'
  AND COLUMN_NAME = 'store_code';

-- Check stores.store_code collation
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME,
    CHARACTER_SET_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'stores'
  AND COLUMN_NAME = 'store_code';

-- Check warehouses.warehouse_code collation (for reference)
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME,
    CHARACTER_SET_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'warehouses'
  AND COLUMN_NAME = 'warehouse_code';

-- ============================================================================
-- STEP 2: FIX THE COLLATION MISMATCH
-- Choose ONE of these options based on your preference
-- ============================================================================

-- OPTION A: Change store_inventory.store_code to match stores.store_code
-- (Recommended if stores table is your primary reference)
-- -----------------------------------------------------------------------

ALTER TABLE store_inventory 
MODIFY COLUMN store_code VARCHAR(50) 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_0900_ai_ci 
NULL;

-- OPTION B: Change stores.store_code to match store_inventory.store_code
-- (Use this if you prefer utf8mb4_unicode_ci)
-- -----------------------------------------------------------------------

-- ALTER TABLE stores 
-- MODIFY COLUMN store_code VARCHAR(50) 
-- CHARACTER SET utf8mb4 
-- COLLATE utf8mb4_unicode_ci 
-- NULL;

-- OPTION C: Standardize both to utf8mb4_0900_ai_ci (MySQL 8.0 default)
-- (Recommended for new systems)
-- -----------------------------------------------------------------------

-- ALTER TABLE store_inventory 
-- MODIFY COLUMN store_code VARCHAR(50) 
-- CHARACTER SET utf8mb4 
-- COLLATE utf8mb4_0900_ai_ci 
-- NULL;

-- ALTER TABLE stores 
-- MODIFY COLUMN store_code VARCHAR(50) 
-- CHARACTER SET utf8mb4 
-- COLLATE utf8mb4_0900_ai_ci 
-- NULL;

-- ============================================================================
-- STEP 3: VERIFY THE FIX
-- ============================================================================

-- Check collations again after fix
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('store_inventory', 'stores')
  AND COLUMN_NAME IN ('store_code')
ORDER BY TABLE_NAME;

-- Test the JOIN (should work now without collation error)
SELECT 
    si.store_code,
    s.store_name,
    COUNT(*) as products
FROM store_inventory si
LEFT JOIN stores s ON si.store_code = s.store_code
GROUP BY si.store_code, s.store_name;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- utf8mb4_0900_ai_ci: MySQL 8.0 default, better Unicode support
-- utf8mb4_unicode_ci: Older standard, widely compatible
-- 
-- Both are case-insensitive (ci) and accent-insensitive (ai)
-- The difference is mainly in sorting and comparison rules
-- 
-- For consistency, it's best to use the same collation across all tables
-- ============================================================================
