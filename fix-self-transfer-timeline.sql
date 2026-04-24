-- FIX SELF TRANSFER TIMELINE ENTRIES
-- Problem: Self-transfers not appearing in timeline because entries not being created in inventory_ledger_base

-- 1. Check existing self-transfer data
SELECT 'EXISTING SELF TRANSFERS:' as info;
SELECT transfer_reference, transfer_type, source_location, destination_location, created_at 
FROM self_transfer 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if any self-transfer entries exist in ledger
SELECT 'SELF TRANSFER ENTRIES IN LEDGER:' as info;
SELECT COUNT(*) as count FROM inventory_ledger_base WHERE movement_type = 'SELF_TRANSFER';

-- 3. Check recent self-transfer items
SELECT 'SELF TRANSFER ITEMS:' as info;
SELECT st.transfer_reference, st.transfer_type, sti.product_name, sti.barcode, sti.qty
FROM self_transfer st
JOIN self_transfer_items sti ON st.id = sti.transfer_id
ORDER BY st.created_at DESC
LIMIT 10;

-- 4. Manually insert missing self-transfer timeline entries for recent transfers
INSERT INTO inventory_ledger_base (
    event_time, movement_type, barcode, product_name, 
    location_code, qty, direction, reference, tenant_id
)
SELECT 
    st.created_at as event_time,
    'SELF_TRANSFER' as movement_type,
    sti.barcode,
    sti.product_name,
    -- OUT entry for source warehouse
    st.source_location as location_code,
    sti.qty,
    'OUT' as direction,
    st.transfer_reference as reference,
    1 as tenant_id
FROM self_transfer st
JOIN self_transfer_items sti ON st.id = sti.transfer_id
WHERE st.transfer_type IN ('W to W', 'W to S') -- Source is warehouse
AND NOT EXISTS (
    SELECT 1 FROM inventory_ledger_base ilb 
    WHERE ilb.reference = st.transfer_reference 
    AND ilb.location_code = st.source_location
    AND ilb.direction = 'OUT'
);

-- 5. Insert IN entries for destination warehouses
INSERT INTO inventory_ledger_base (
    event_time, movement_type, barcode, product_name, 
    location_code, qty, direction, reference, tenant_id
)
SELECT 
    st.created_at as event_time,
    'SELF_TRANSFER' as movement_type,
    sti.barcode,
    sti.product_name,
    -- IN entry for destination warehouse
    st.destination_location as location_code,
    sti.qty,
    'IN' as direction,
    st.transfer_reference as reference,
    1 as tenant_id
FROM self_transfer st
JOIN self_transfer_items sti ON st.id = sti.transfer_id
WHERE st.transfer_type IN ('W to W', 'S to W') -- Destination is warehouse
AND NOT EXISTS (
    SELECT 1 FROM inventory_ledger_base ilb 
    WHERE ilb.reference = st.transfer_reference 
    AND ilb.location_code = st.destination_location
    AND ilb.direction = 'IN'
);

-- 6. Verify entries were created
SELECT 'VERIFICATION - SELF TRANSFER ENTRIES AFTER INSERT:' as info;
SELECT movement_type, location_code, direction, COUNT(*) as count
FROM inventory_ledger_base 
WHERE movement_type = 'SELF_TRANSFER'
GROUP BY movement_type, location_code, direction
ORDER BY location_code, direction;

-- 7. Show recent self-transfer timeline entries
SELECT 'RECENT SELF TRANSFER TIMELINE ENTRIES:' as info;
SELECT event_time, barcode, product_name, location_code, qty, direction, reference
FROM inventory_ledger_base 
WHERE movement_type = 'SELF_TRANSFER'
ORDER BY event_time DESC
LIMIT 10;