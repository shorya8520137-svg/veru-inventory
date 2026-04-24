-- Fix collation issue for store inventory API
USE inventory_db;

-- 1. Check current collations
SELECT 'CHECKING TABLE COLLATIONS' as step;
SHOW TABLE STATUS WHERE Name IN ('store_inventory', 'dispatch_product', 'product_categories');

-- 2. Check column collations
SELECT 'CHECKING COLUMN COLLATIONS' as step;
SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'inventory_db' 
AND TABLE_NAME IN ('store_inventory', 'dispatch_product') 
AND COLUMN_NAME = 'barcode';

-- 3. Fix store_inventory barcode column collation
SELECT 'FIXING STORE_INVENTORY BARCODE COLLATION' as step;
ALTER TABLE store_inventory MODIFY barcode VARCHAR(255) COLLATE utf8mb4_unicode_ci;

-- 4. Test the fixed query
SELECT 'TESTING FIXED QUERY' as step;
SELECT 
    si.id,
    COALESCE(dp.product_name, si.product_name, si.barcode) as product_name,
    si.barcode,
    si.stock
FROM store_inventory si
LEFT JOIN dispatch_product dp ON si.barcode = dp.barcode
LIMIT 5;

-- 5. Verify the fix
SELECT 'VERIFYING FIX' as step;
SELECT COUNT(*) as total_products,
       COUNT(dp.product_name) as products_with_names
FROM store_inventory si
LEFT JOIN dispatch_product dp ON si.barcode = dp.barcode;

SELECT 'COLLATION FIX COMPLETE' as result;