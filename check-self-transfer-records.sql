-- Check self-transfer records in inventory_ledger_base
SELECT 'SELF TRANSFER RECORDS COUNT:' as info;
SELECT COUNT(*) as total_count FROM inventory_ledger_base WHERE movement_type = 'SELF_TRANSFER';

SELECT 'SELF TRANSFER BY DIRECTION:' as info;
SELECT direction, COUNT(*) as count 
FROM inventory_ledger_base 
WHERE movement_type = 'SELF_TRANSFER' 
GROUP BY direction;

SELECT 'RECENT SELF TRANSFER ENTRIES:' as info;
SELECT event_time, barcode, product_name, location_code, qty, direction, reference
FROM inventory_ledger_base 
WHERE movement_type = 'SELF_TRANSFER'
ORDER BY event_time DESC
LIMIT 10;

SELECT 'RECENT SELF TRANSFERS FROM MAIN TABLE:' as info;
SELECT transfer_reference, transfer_type, source_location, destination_location, created_at
FROM self_transfer
ORDER BY created_at DESC
LIMIT 5;