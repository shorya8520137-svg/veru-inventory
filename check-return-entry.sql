-- Check return entry details
SELECT 'RETURN ENTRY DETAILS:' as '';
SELECT * FROM returns_main WHERE id = 1;

-- Check timeline entry
SELECT '' as '';
SELECT 'TIMELINE ENTRIES:' as '';
SELECT * FROM inventory_ledger_base WHERE reference LIKE 'RETURN_1%';

-- Check stock batch
SELECT '' as '';
SELECT 'STOCK BATCHES:' as '';
SELECT * FROM stock_batches WHERE source_type = 'RETURN' AND source_ref_id = 1;
