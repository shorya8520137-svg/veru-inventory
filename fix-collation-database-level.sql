-- FIX COLLATION ISSUES AT DATABASE LEVEL
-- Problem: Different tables have different collations causing JOIN errors

-- Check current collations
SELECT 'CURRENT TABLE COLLATIONS:' as info;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'inventory_db' 
AND TABLE_NAME IN ('store_inventory', 'dispatch_product', 'product_categories')
AND COLUMN_NAME IN ('barcode', 'product_name', 'name')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Fix store_inventory table collation
SELECT 'FIXING STORE_INVENTORY COLLATIONS:' as info;
ALTER TABLE store_inventory 
    MODIFY barcode VARCHAR(100) COLLATE utf8mb4_unicode_ci,
    MODIFY product_name VARCHAR(255) COLLATE utf8mb4_unicode_ci,
    MODIFY category VARCHAR(100) COLLATE utf8mb4_unicode_ci;

-- Fix dispatch_product table collation  
SELECT 'FIXING DISPATCH_PRODUCT COLLATIONS:' as info;
ALTER TABLE dispatch_product 
    MODIFY barcode VARCHAR(50) COLLATE utf8mb4_unicode_ci,
    MODIFY product_name VARCHAR(255) COLLATE utf8mb4_unicode_ci;

-- Fix product_categories table collation
SELECT 'FIXING PRODUCT_CATEGORIES COLLATIONS:' as info;
ALTER TABLE product_categories 
    MODIFY name VARCHAR(100) COLLATE utf8mb4_unicode_ci;

-- Verify the fix
SELECT 'VERIFICATION - UPDATED COLLATIONS:' as info;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'inventory_db' 
AND TABLE_NAME IN ('store_inventory', 'dispatch_product', 'product_categories')
AND COLUMN_NAME IN ('barcode', 'product_name', 'name')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Test the problematic query
SELECT 'TESTING FIXED QUERY:' as info;
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
ORDER BY COALESCE(dp.product_name, si.product_name, si.barcode) ASC
LIMIT 5;