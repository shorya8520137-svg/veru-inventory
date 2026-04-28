-- =====================================================
-- EXACT SQL QUERIES USED BY DAMAGE API
-- These are the queries from damageRecoveryController.js
-- =====================================================

-- Product: bra Product 178
-- Barcode: 433967585453
-- Warehouse: GGM_WH
-- Quantity: 1

-- =====================================================
-- STEP 1: Check Available Stock
-- =====================================================
-- This query checks how much stock is available in stock_batches

SELECT 
    SUM(qty_available) as available_stock 
FROM stock_batches 
WHERE barcode = '433967585453' 
  AND warehouse = 'GGM_WH' 
  AND status = 'active';

-- Expected Result: Should return available_stock
-- Actual Result: Returns 0 (that's why "Insufficient stock" error)


-- =====================================================
-- STEP 2: Get All Batches for This Product
-- =====================================================
-- Let's see what batches exist for this product

SELECT 
    id,
    product_name,
    barcode,
    warehouse,
    qty_initial,
    qty_available,
    status,
    source_type,
    created_at
FROM stock_batches 
WHERE barcode = '433967585453' 
  AND warehouse = 'GGM_WH'
ORDER BY created_at ASC;

-- This will show ALL batches (active, exhausted, etc.)


-- =====================================================
-- STEP 3: Check What Inventory Page is Showing
-- =====================================================
-- The inventory page might be using a different query
-- Let's check what it's actually counting

-- Option A: Maybe it's counting from products table?
SELECT 
    p.product_name,
    p.barcode,
    p.current_stock
FROM products p
WHERE p.barcode = '433967585453';

-- Option B: Maybe it's counting from a different table?
SELECT 
    barcode,
    SUM(qty_available) as total_stock
FROM stock_batches
WHERE barcode = '433967585453'
GROUP BY barcode;

-- Option C: Maybe it's including ALL statuses (not just 'active')?
SELECT 
    status,
    SUM(qty_available) as stock_per_status
FROM stock_batches
WHERE barcode = '433967585453'
  AND warehouse = 'GGM_WH'
GROUP BY status;


-- =====================================================
-- STEP 4: Check Inventory Ledger
-- =====================================================
-- Let's see what the ledger says about this product

SELECT 
    event_time,
    movement_type,
    qty,
    direction,
    reference,
    location_code
FROM inventory_ledger_base
WHERE barcode = '433967585453'
  AND location_code = 'GGM_WH'
ORDER BY event_time DESC
LIMIT 20;


-- =====================================================
-- DIAGNOSTIC QUERY: Find the Mismatch
-- =====================================================
-- This will show us where the 38 units are coming from

SELECT 
    'stock_batches (active only)' as source,
    COALESCE(SUM(qty_available), 0) as stock_count
FROM stock_batches
WHERE barcode = '433967585453' 
  AND warehouse = 'GGM_WH' 
  AND status = 'active'

UNION ALL

SELECT 
    'stock_batches (all statuses)' as source,
    COALESCE(SUM(qty_available), 0) as stock_count
FROM stock_batches
WHERE barcode = '433967585453' 
  AND warehouse = 'GGM_WH'

UNION ALL

SELECT 
    'products table' as source,
    COALESCE(current_stock, 0) as stock_count
FROM products
WHERE barcode = '433967585453'
LIMIT 1;


-- =====================================================
-- FIX QUERY: If stock_batches is wrong
-- =====================================================
-- If stock_batches shows 0 but should show 38, we need to fix it

-- First, check if there's a batch with exhausted status that should be active
UPDATE stock_batches
SET 
    qty_available = 38,
    status = 'active'
WHERE barcode = '433967585453'
  AND warehouse = 'GGM_WH'
  AND qty_available = 0
  AND status = 'exhausted';

-- OR create a new batch if none exists
INSERT INTO stock_batches (
    product_name,
    barcode,
    warehouse,
    source_type,
    qty_initial,
    qty_available,
    unit_cost,
    status,
    created_at
) VALUES (
    'bra Product 178',
    '433967585453',
    'GGM_WH',
    'OPENING',
    38,
    38,
    0.00,
    'active',
    NOW()
);


-- =====================================================
-- VERIFICATION: After Fix
-- =====================================================
-- Run this to verify the fix worked

SELECT 
    'After Fix - Available Stock' as check_name,
    SUM(qty_available) as stock_count
FROM stock_batches 
WHERE barcode = '433967585453' 
  AND warehouse = 'GGM_WH' 
  AND status = 'active';

-- Should now return 38
