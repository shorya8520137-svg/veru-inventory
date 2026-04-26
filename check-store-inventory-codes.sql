-- ============================================================================
-- CHECK STORE INVENTORY CODES
-- Run these queries to diagnose the store_code issue
-- ============================================================================

-- 1. Check current store_code values in store_inventory
SELECT 
    id,
    store_code,
    product_name,
    barcode,
    stock,
    price
FROM store_inventory
ORDER BY id;

-- 2. Count products by store_code (see which are NULL)
SELECT 
    COALESCE(store_code, 'NULL') as store_code,
    COUNT(*) as product_count
FROM store_inventory
GROUP BY store_code;

-- 3. Check what store codes exist in stores table
SELECT 
    id,
    store_code,
    store_name,
    city
FROM stores
ORDER BY id;

-- 4. Find products with NULL store_code
SELECT 
    id,
    product_name,
    barcode,
    stock,
    store_code
FROM store_inventory
WHERE store_code IS NULL;

-- ============================================================================
-- FIX: Set default store code for NULL records
-- ============================================================================

-- Option 1: Set all NULL records to a specific store
-- CHANGE 'GGM_NH48' to your actual default store code
UPDATE store_inventory 
SET store_code = 'GGM_NH48' 
WHERE store_code IS NULL;

-- Option 2: Set to first store in stores table
UPDATE store_inventory si
SET si.store_code = (SELECT store_code FROM stores LIMIT 1)
WHERE si.store_code IS NULL;

-- ============================================================================
-- VERIFY THE FIX
-- ============================================================================

-- Check if all records now have store_code
SELECT 
    CASE 
        WHEN store_code IS NULL THEN 'NULL'
        ELSE store_code 
    END as store_code,
    COUNT(*) as count
FROM store_inventory
GROUP BY store_code;

-- Show all products with their store codes
SELECT 
    id,
    store_code,
    product_name,
    barcode,
    stock
FROM store_inventory
ORDER BY store_code, product_name;
