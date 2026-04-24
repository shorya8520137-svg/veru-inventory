-- FIXED JOIN QUERY WITHOUT COLLATION ISSUES
-- This query joins store_inventory with dispatch_product to get proper product names

SELECT 
    si.id,
    COALESCE(dp.product_name, si.product_name, si.barcode) as product_name,
    si.barcode,
    COALESCE(pc.name, si.category, 'General') as category,
    si.stock,
    si.price,
    si.gst_percentage,
    si.last_updated,
    si.created_at
FROM store_inventory si
LEFT JOIN dispatch_product dp ON si.barcode = dp.barcode
LEFT JOIN product_categories pc ON dp.category_id = pc.id
ORDER BY COALESCE(dp.product_name, si.product_name, si.barcode) ASC;

-- EXPLANATION:
-- 1. Removed COLLATE clauses that were causing the collation mismatch error
-- 2. MySQL will use the default collation for both tables
-- 3. The JOIN will work as long as both barcode columns have compatible collations
-- 4. COALESCE ensures we get the best available product name (dispatch_product > store_inventory > barcode)

-- If you still get collation errors, run this to check table collations:
-- SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME 
-- FROM information_schema.COLUMNS 
-- WHERE TABLE_SCHEMA = 'inventory_db' 
-- AND COLUMN_NAME = 'barcode' 
-- AND TABLE_NAME IN ('store_inventory', 'dispatch_product');

-- To fix collation permanently, you can alter the tables:
-- ALTER TABLE store_inventory MODIFY barcode VARCHAR(255) COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE dispatch_product MODIFY barcode VARCHAR(255) COLLATE utf8mb4_unicode_ci;