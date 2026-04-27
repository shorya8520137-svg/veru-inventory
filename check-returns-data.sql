-- ============================================
-- CHECK RETURNS TABLE AND RELATED DATA
-- ============================================

-- 1. Check total count of returns
SELECT '=== TOTAL RETURNS COUNT ===' as '';
SELECT COUNT(*) as total_returns FROM returns_main;

-- 2. Get all returns with full details
SELECT '' as '';
SELECT '=== ALL RETURNS RECORDS ===' as '';
SELECT 
    id,
    return_type,
    source_location,
    destination_location,
    warehouse,
    product_type,
    barcode,
    quantity,
    `condition`,
    status,
    awb,
    order_ref,
    return_reason,
    processed_by,
    processed_at,
    submitted_at,
    notes,
    has_parts,
    original_dispatch_id,
    tenant_id
FROM returns_main 
ORDER BY id DESC;

-- 3. Check returns by type
SELECT '' as '';
SELECT '=== RETURNS BY TYPE ===' as '';
SELECT 
    return_type,
    COUNT(*) as count,
    SUM(quantity) as total_quantity
FROM returns_main 
GROUP BY return_type;

-- 4. Check returns by status
SELECT '' as '';
SELECT '=== RETURNS BY STATUS ===' as '';
SELECT 
    status,
    COUNT(*) as count,
    SUM(quantity) as total_quantity
FROM returns_main 
GROUP BY status;

-- 5. Check returns by condition
SELECT '' as '';
SELECT '=== RETURNS BY CONDITION ===' as '';
SELECT 
    `condition`,
    COUNT(*) as count,
    SUM(quantity) as total_quantity
FROM returns_main 
GROUP BY `condition`;

-- 6. Check returns by location
SELECT '' as '';
SELECT '=== RETURNS BY SOURCE LOCATION ===' as '';
SELECT 
    source_location,
    COUNT(*) as count,
    SUM(quantity) as total_quantity
FROM returns_main 
GROUP BY source_location
ORDER BY count DESC;

-- 7. Check warehouse timeline entries for returns
SELECT '' as '';
SELECT '=== WAREHOUSE TIMELINE ENTRIES (inventory_ledger_base) ===' as '';
SELECT 
    id,
    event_time,
    movement_type,
    barcode,
    product_name,
    location_code,
    qty,
    direction,
    reference
FROM inventory_ledger_base 
WHERE reference LIKE 'RETURN_%'
ORDER BY event_time DESC
LIMIT 20;

-- 8. Count warehouse timeline entries
SELECT '' as '';
SELECT '=== WAREHOUSE TIMELINE COUNT ===' as '';
SELECT COUNT(*) as warehouse_timeline_entries
FROM inventory_ledger_base 
WHERE reference LIKE 'RETURN_%';

-- 9. Check store timeline entries for returns
SELECT '' as '';
SELECT '=== STORE TIMELINE ENTRIES (store_timeline) ===' as '';
SELECT 
    id,
    store_code,
    product_barcode,
    product_name,
    movement_type,
    direction,
    quantity,
    balance_after,
    reference,
    created_at
FROM store_timeline 
WHERE reference LIKE 'RETURN_%'
ORDER BY created_at DESC
LIMIT 20;

-- 10. Count store timeline entries
SELECT '' as '';
SELECT '=== STORE TIMELINE COUNT ===' as '';
SELECT COUNT(*) as store_timeline_entries
FROM store_timeline 
WHERE reference LIKE 'RETURN_%';

-- 11. Check stock batches created from returns
SELECT '' as '';
SELECT '=== STOCK BATCHES FROM RETURNS ===' as '';
SELECT 
    id,
    barcode,
    product_name,
    warehouse,
    qty_initial,
    qty_available,
    status,
    source_type,
    source_ref_id,
    created_at,
    updated_at
FROM stock_batches 
WHERE source_type = 'RETURN'
ORDER BY created_at DESC
LIMIT 20;

-- 12. Count stock batches from returns
SELECT '' as '';
SELECT '=== STOCK BATCHES COUNT ===' as '';
SELECT COUNT(*) as stock_batches_from_returns
FROM stock_batches 
WHERE source_type = 'RETURN';

-- 13. Check recent returns with timeline correlation
SELECT '' as '';
SELECT '=== RECENT RETURNS WITH TIMELINE CORRELATION ===' as '';
SELECT 
    r.id as return_id,
    r.return_type,
    r.source_location,
    r.product_type,
    r.barcode,
    r.quantity,
    r.status,
    r.submitted_at,
    COUNT(DISTINCT il.id) as warehouse_timeline_entries,
    COUNT(DISTINCT st.id) as store_timeline_entries,
    COUNT(DISTINCT sb.id) as stock_batches
FROM returns_main r
LEFT JOIN inventory_ledger_base il ON il.reference LIKE CONCAT('RETURN_', r.id, '%')
LEFT JOIN store_timeline st ON st.reference LIKE CONCAT('RETURN_', r.id, '%')
LEFT JOIN stock_batches sb ON sb.source_type = 'RETURN' AND sb.source_ref_id = r.id
GROUP BY r.id
ORDER BY r.id DESC
LIMIT 10;

-- 14. Check returns table schema
SELECT '' as '';
SELECT '=== RETURNS TABLE SCHEMA ===' as '';
DESCRIBE returns_main;

-- 15. Summary statistics
SELECT '' as '';
SELECT '=== SUMMARY STATISTICS ===' as '';
SELECT 
    (SELECT COUNT(*) FROM returns_main) as total_returns,
    (SELECT COUNT(*) FROM returns_main WHERE status = 'processed') as processed_returns,
    (SELECT COUNT(*) FROM returns_main WHERE status = 'pending') as pending_returns,
    (SELECT COUNT(*) FROM returns_main WHERE return_type = 'WAREHOUSE') as warehouse_returns,
    (SELECT COUNT(*) FROM returns_main WHERE return_type = 'STORE') as store_returns,
    (SELECT SUM(quantity) FROM returns_main) as total_quantity_returned,
    (SELECT COUNT(*) FROM inventory_ledger_base WHERE reference LIKE 'RETURN_%') as warehouse_timeline_entries,
    (SELECT COUNT(*) FROM store_timeline WHERE reference LIKE 'RETURN_%') as store_timeline_entries,
    (SELECT COUNT(*) FROM stock_batches WHERE source_type = 'RETURN') as stock_batches_from_returns;

-- 16. Check if table is empty
SELECT '' as '';
SELECT '=== TABLE STATUS ===' as '';
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Table is EMPTY (no returns data)'
        ELSE CONCAT('⚠️ Table has ', COUNT(*), ' return records')
    END as status
FROM returns_main;
