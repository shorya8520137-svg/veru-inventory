-- CRITICAL INVENTORY SYNCHRONIZATION FIX
-- This script fixes the issue where timeline shows stock changes but live stock doesn't update

-- 1. First, let's see the current state
SELECT 'CURRENT TIMELINE ENTRIES' as analysis_step;
SELECT 
    id, event_time, movement_type, barcode, product_name, 
    location_code, qty, direction, reference
FROM inventory_ledger_base 
WHERE barcode = '2460-3499'
ORDER BY event_time DESC
LIMIT 10;

SELECT 'CURRENT STOCK BATCHES' as analysis_step;
SELECT 
    id, barcode, product_name, warehouse, qty_available, 
    status, created_at, updated_at
FROM stock_batches 
WHERE barcode = '2460-3499'
ORDER BY warehouse;

SELECT 'SELF TRANSFER ENTRIES' as analysis_step;
SELECT 
    st.id, st.transfer_reference, st.source_location, st.destination_location, st.created_at,
    sti.product_name, sti.barcode, sti.qty
FROM self_transfer st
JOIN self_transfer_items sti ON st.id = sti.transfer_id
WHERE sti.barcode = '2460-3499'
ORDER BY st.created_at DESC;

-- 2. Calculate what the stock SHOULD be based on timeline
SELECT 'STOCK RECONCILIATION' as analysis_step;
SELECT 
    'BLR_WH' as warehouse,
    COALESCE(SUM(CASE WHEN direction = 'IN' THEN qty ELSE -qty END), 0) as calculated_stock
FROM inventory_ledger_base 
WHERE barcode = '2460-3499' 
AND location_code = 'BLR_WH'
UNION ALL
SELECT 
    'GGM_WH' as warehouse,
    COALESCE(SUM(CASE WHEN direction = 'IN' THEN qty ELSE -qty END), 0) as calculated_stock
FROM inventory_ledger_base 
WHERE barcode = '2460-3499' 
AND location_code = 'GGM_WH';

-- 3. Fix the stock_batches table to match timeline
-- Update BLR_WH stock based on timeline calculations
UPDATE stock_batches 
SET qty_available = (
    SELECT COALESCE(SUM(CASE WHEN direction = 'IN' THEN qty ELSE -qty END), 0)
    FROM inventory_ledger_base 
    WHERE barcode = '2460-3499' 
    AND location_code = 'BLR_WH'
),
updated_at = NOW()
WHERE barcode = '2460-3499' 
AND warehouse = 'BLR_WH' 
AND status = 'active';

-- Create or update GGM_WH stock based on timeline calculations
INSERT INTO stock_batches (
    barcode, product_name, warehouse, qty_available, 
    price, gst_percentage, status, created_at, updated_at
)
SELECT 
    '2460-3499',
    'HH_Bedding Cutie cat CC',
    'GGM_WH',
    COALESCE(SUM(CASE WHEN direction = 'IN' THEN qty ELSE -qty END), 0),
    0.00,
    18.00,
    'active',
    NOW(),
    NOW()
FROM inventory_ledger_base 
WHERE barcode = '2460-3499' 
AND location_code = 'GGM_WH'
ON DUPLICATE KEY UPDATE
qty_available = VALUES(qty_available),
updated_at = NOW();

-- 4. Remove duplicate self_transfer entries if any exist
-- First, identify duplicates
SELECT 'CHECKING FOR DUPLICATES' as analysis_step;
SELECT 
    transfer_reference, COUNT(*) as count
FROM self_transfer 
GROUP BY transfer_reference 
HAVING COUNT(*) > 1;

-- Remove duplicate entries (keep the first one)
DELETE st1 FROM self_transfer st1
INNER JOIN self_transfer st2 
WHERE st1.id > st2.id 
AND st1.transfer_reference = st2.transfer_reference;

-- 5. Verify the fix
SELECT 'VERIFICATION - UPDATED STOCK BATCHES' as analysis_step;
SELECT 
    id, barcode, product_name, warehouse, qty_available, 
    status, updated_at
FROM stock_batches 
WHERE barcode = '2460-3499'
ORDER BY warehouse;

SELECT 'VERIFICATION - TIMELINE VS STOCK COMPARISON' as analysis_step;
SELECT 
    'Timeline Calculation' as source,
    location_code as warehouse,
    SUM(CASE WHEN direction = 'IN' THEN qty ELSE -qty END) as stock_level
FROM inventory_ledger_base 
WHERE barcode = '2460-3499'
GROUP BY location_code
UNION ALL
SELECT 
    'Stock Batches' as source,
    warehouse,
    qty_available as stock_level
FROM stock_batches 
WHERE barcode = '2460-3499' 
AND status = 'active'
ORDER BY warehouse, source;

-- 6. Create a stored procedure to prevent future synchronization issues
DELIMITER //

CREATE PROCEDURE SyncInventoryStock(
    IN p_barcode VARCHAR(50),
    IN p_warehouse VARCHAR(50)
)
BEGIN
    DECLARE calculated_stock DECIMAL(10,2) DEFAULT 0;
    
    -- Calculate stock from timeline
    SELECT COALESCE(SUM(CASE WHEN direction = 'IN' THEN qty ELSE -qty END), 0)
    INTO calculated_stock
    FROM inventory_ledger_base 
    WHERE barcode = p_barcode 
    AND location_code = p_warehouse;
    
    -- Update or insert stock batch
    INSERT INTO stock_batches (
        barcode, product_name, warehouse, qty_available, 
        price, gst_percentage, status, created_at, updated_at
    )
    SELECT 
        p_barcode,
        product_name,
        p_warehouse,
        calculated_stock,
        COALESCE(price, 0.00),
        COALESCE(gst_percentage, 18.00),
        'active',
        NOW(),
        NOW()
    FROM dispatch_product 
    WHERE barcode = p_barcode
    LIMIT 1
    ON DUPLICATE KEY UPDATE
    qty_available = calculated_stock,
    updated_at = NOW();
    
END //

DELIMITER ;

-- 7. Test the stored procedure
CALL SyncInventoryStock('2460-3499', 'BLR_WH');
CALL SyncInventoryStock('2460-3499', 'GGM_WH');

SELECT 'FINAL VERIFICATION' as analysis_step;
SELECT 
    warehouse,
    qty_available,
    updated_at
FROM stock_batches 
WHERE barcode = '2460-3499' 
AND status = 'active'
ORDER BY warehouse;