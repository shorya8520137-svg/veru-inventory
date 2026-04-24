-- ANALYZE INVENTORY TRANSACTIONS DATABASE STRUCTURE
-- Understanding how transactions are recorded in inventory_ledger_base

-- 1. Check inventory_ledger_base table structure
DESCRIBE inventory_ledger_base;

-- 2. Check existing transaction types
SELECT DISTINCT movement_type, direction, COUNT(*) as count
FROM inventory_ledger_base 
GROUP BY movement_type, direction
ORDER BY movement_type, direction;

-- 3. Check sample entries to understand pattern
SELECT * FROM inventory_ledger_base 
ORDER BY event_time DESC 
LIMIT 20;

-- 4. Check self_transfer table structure
DESCRIBE self_transfer;

-- 5. Check self_transfer_items table structure  
DESCRIBE self_transfer_items;

-- 6. Check if any self-transfer entries exist in ledger
SELECT * FROM inventory_ledger_base 
WHERE movement_type = 'SELF_TRANSFER'
ORDER BY event_time DESC
LIMIT 10;

-- 7. Check recent self-transfers
SELECT * FROM self_transfer 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Check self-transfer items
SELECT st.transfer_reference, st.transfer_type, st.source_location, st.destination_location,
       sti.product_name, sti.barcode, sti.qty
FROM self_transfer st
JOIN self_transfer_items sti ON st.id = sti.transfer_id
ORDER BY st.created_at DESC
LIMIT 10;