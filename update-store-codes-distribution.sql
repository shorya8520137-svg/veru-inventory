-- ============================================================================
-- UPDATE STORE CODES - DISTRIBUTE PRODUCTS ACROSS STORES
-- Use these queries to assign products to different stores
-- ============================================================================

-- STEP 1: CHECK CURRENT STATE
-- See what products you have and what stores are available
-- ============================================================================

-- Your current products in store_inventory
SELECT 
    id,
    store_code,
    product_name,
    barcode,
    stock,
    price
FROM store_inventory
ORDER BY id;

-- Your available stores
SELECT 
    store_code,
    store_name,
    city,
    state
FROM stores
ORDER BY city, store_name;

-- ============================================================================
-- STEP 2: UPDATE STORE CODES FOR INDIVIDUAL PRODUCTS
-- Choose which products go to which stores
-- ============================================================================

-- Option A: Assign specific products to specific stores by barcode
-- -----------------------------------------------------------------------

-- Product 1 (barcode: 361313801009) -> GGM_NH48
UPDATE store_inventory 
SET store_code = 'GGM_NH48' 
WHERE barcode = '361313801009';

-- Product 2 (barcode: 199627757257) -> GGM_MGF_MALL
UPDATE store_inventory 
SET store_code = 'GGM_MGF_MALL' 
WHERE barcode = '199627757257';

-- Add more products to other stores as needed:
-- UPDATE store_inventory SET store_code = 'GGM_ROSHANPURA' WHERE barcode = 'YOUR_BARCODE';
-- UPDATE store_inventory SET store_code = 'BLR_BROOKEFIELD' WHERE barcode = 'YOUR_BARCODE';
-- UPDATE store_inventory SET store_code = 'BLR_HUNYHUNY' WHERE barcode = 'YOUR_BARCODE';
-- UPDATE store_inventory SET store_code = 'HYD_KONDAPUR' WHERE barcode = 'YOUR_BARCODE';
-- UPDATE store_inventory SET store_code = 'HYD_KOMPALLY' WHERE barcode = 'YOUR_BARCODE';
-- UPDATE store_inventory SET store_code = 'DEL_MOTI_NAGAR' WHERE barcode = 'YOUR_BARCODE';
-- UPDATE store_inventory SET store_code = 'AMD_GUJARAT' WHERE barcode = 'YOUR_BARCODE';


-- Option B: Assign products by ID
-- -----------------------------------------------------------------------

-- Product ID 1 -> GGM_NH48
UPDATE store_inventory 
SET store_code = 'GGM_NH48' 
WHERE id = 1;

-- Product ID 2 -> GGM_MGF_MALL
UPDATE store_inventory 
SET store_code = 'GGM_MGF_MALL' 
WHERE id = 2;


-- Option C: Set all NULL products to a default store
-- -----------------------------------------------------------------------

-- Set all products without store_code to GGM_NH48
UPDATE store_inventory 
SET store_code = 'GGM_NH48' 
WHERE store_code IS NULL;


-- Option D: Distribute products evenly across all stores (if you have many products)
-- -----------------------------------------------------------------------
-- This will assign products to stores in a round-robin fashion
-- WARNING: Only use this if you want automatic distribution

-- First, see the distribution plan:
SELECT 
    id,
    barcode,
    product_name,
    stock,
    (SELECT store_code FROM stores ORDER BY id LIMIT 1 OFFSET (si.id - 1) % (SELECT COUNT(*) FROM stores)) as suggested_store_code
FROM store_inventory si
WHERE store_code IS NULL;

-- Then apply it (uncomment to use):
-- UPDATE store_inventory si
-- SET store_code = (
--     SELECT store_code 
--     FROM stores 
--     ORDER BY id 
--     LIMIT 1 OFFSET (si.id - 1) % (SELECT COUNT(*) FROM stores)
-- )
-- WHERE store_code IS NULL;


-- ============================================================================
-- STEP 3: VERIFY THE UPDATES
-- ============================================================================

-- Check distribution across stores
SELECT 
    COALESCE(si.store_code, 'NULL') as store_code,
    s.store_name,
    s.city,
    COUNT(si.id) as product_count,
    SUM(si.stock) as total_stock
FROM store_inventory si
LEFT JOIN stores s ON si.store_code = s.store_code
GROUP BY si.store_code, s.store_name, s.city
ORDER BY si.store_code;

-- See all products with their assigned stores
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

-- Check for any remaining NULL store_codes
SELECT 
    id,
    product_name,
    barcode,
    stock,
    'WARNING: No store code assigned' as status
FROM store_inventory
WHERE store_code IS NULL;

-- ============================================================================
-- STEP 4: QUICK FIXES FOR COMMON SCENARIOS
-- ============================================================================

-- Scenario 1: Move all products from one store to another
-- Example: Move all products from GGM_NH48 to GGM_MGF_MALL
-- UPDATE store_inventory 
-- SET store_code = 'GGM_MGF_MALL' 
-- WHERE store_code = 'GGM_NH48';

-- Scenario 2: Move specific product to different store
-- Example: Move barcode 361313801009 from current store to BLR_BROOKEFIELD
-- UPDATE store_inventory 
-- SET store_code = 'BLR_BROOKEFIELD' 
-- WHERE barcode = '361313801009';

-- Scenario 3: Set all products to same store (useful for testing)
-- UPDATE store_inventory 
-- SET store_code = 'GGM_NH48';

-- ============================================================================
-- STEP 5: VALIDATION QUERIES
-- ============================================================================

-- Ensure all store_codes in inventory exist in stores table
SELECT 
    si.store_code as inventory_store_code,
    COUNT(si.id) as product_count,
    CASE 
        WHEN s.store_code IS NULL THEN 'INVALID - Store does not exist'
        ELSE 'VALID'
    END as validation_status
FROM store_inventory si
LEFT JOIN stores s ON si.store_code = s.store_code
WHERE si.store_code IS NOT NULL
GROUP BY si.store_code, s.store_code;

-- Final summary
SELECT 
    'Total Products' as metric,
    COUNT(*) as count
FROM store_inventory
UNION ALL
SELECT 
    'Products with valid store_code' as metric,
    COUNT(*) as count
FROM store_inventory si
INNER JOIN stores s ON si.store_code = s.store_code
UNION ALL
SELECT 
    'Products with NULL store_code' as metric,
    COUNT(*) as count
FROM store_inventory
WHERE store_code IS NULL
UNION ALL
SELECT 
    'Products with invalid store_code' as metric,
    COUNT(*) as count
FROM store_inventory si
LEFT JOIN stores s ON si.store_code = s.store_code
WHERE si.store_code IS NOT NULL AND s.store_code IS NULL;
