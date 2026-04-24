-- KEY TABLES ANALYSIS FOR SELF-TRANSFER SYSTEM
-- Run this on the server to understand current database state

-- 1. SELF_TRANSFER TABLE ANALYSIS
SELECT 'SELF_TRANSFER_TABLE_STRUCTURE' as analysis_section;
DESCRIBE self_transfer;

SELECT 'SELF_TRANSFER_DATA_SUMMARY' as analysis_section;
SELECT 
    transfer_type,
    source_location,
    destination_location,
    status,
    COUNT(*) as count,
    MIN(created_at) as first_transfer,
    MAX(created_at) as last_transfer
FROM self_transfer 
GROUP BY transfer_type, source_location, destination_location, status
ORDER BY count DESC;

-- 2. SELF_TRANSFER_ITEMS TABLE ANALYSIS  
SELECT 'SELF_TRANSFER_ITEMS_STRUCTURE' as analysis_section;
DESCRIBE self_transfer_items;

SELECT 'SELF_TRANSFER_ITEMS_SAMPLE' as analysis_section;
SELECT * FROM self_transfer_items LIMIT 5;

-- 3. STORE_INVENTORY TABLE ANALYSIS
SELECT 'STORE_INVENTORY_STRUCTURE' as analysis_section;
DESCRIBE store_inventory;

SELECT 'STORE_INVENTORY_SUMMARY' as analysis_section;
SELECT 
    category,
    COUNT(*) as product_count,
    SUM(stock) as total_stock,
    COUNT(CASE WHEN product_name = 'Transferred' THEN 1 END) as transferred_name_count,
    COUNT(CASE WHEN category = 'Transferred' THEN 1 END) as transferred_category_count
FROM store_inventory 
GROUP BY category
ORDER BY product_count DESC;

-- 4. BILLS TABLE ANALYSIS (for transfer documentation)
SELECT 'BILLS_STRUCTURE' as analysis_section;
DESCRIBE bills;

SELECT 'TRANSFER_RELATED_BILLS' as analysis_section;
SELECT 
    bill_type,
    payment_mode,
    COUNT(*) as count,
    SUM(grand_total) as total_amount
FROM bills 
WHERE bill_type LIKE '%transfer%' 
   OR payment_mode = 'transfer'
   OR customer_name LIKE '%Transfer%'
GROUP BY bill_type, payment_mode
ORDER BY count DESC;

-- 5. INVENTORY_LEDGER_BASE TABLE ANALYSIS (for timeline)
SELECT 'INVENTORY_LEDGER_BASE_STRUCTURE' as analysis_section;
DESCRIBE inventory_ledger_base;

SELECT 'SELF_TRANSFER_TIMELINE_ENTRIES' as analysis_section;
SELECT 
    movement_type,
    direction,
    location_code,
    COUNT(*) as count
FROM inventory_ledger_base 
WHERE movement_type = 'SELF_TRANSFER'
   OR reference LIKE 'TRF_%'
GROUP BY movement_type, direction, location_code
ORDER BY count DESC;

-- 6. CRITICAL ISSUE CHECK: W to W transfers in store systems
SELECT 'W_TO_W_IN_STORE_SYSTEMS_CHECK' as analysis_section;
SELECT 
    st.transfer_reference,
    st.transfer_type,
    st.source_location,
    st.destination_location,
    'Found in bills' as issue_type
FROM self_transfer st
JOIN bills b ON b.invoice_number = st.transfer_reference
WHERE st.transfer_type = 'W to W'

UNION ALL

SELECT 
    st.transfer_reference,
    st.transfer_type,
    st.source_location,
    st.destination_location,
    'Found in store timeline' as issue_type
FROM self_transfer st
JOIN inventory_ledger_base ilb ON ilb.reference = st.transfer_reference
WHERE st.transfer_type = 'W to W'
  AND ilb.location_code NOT LIKE 'WH%'
  AND ilb.location_code NOT LIKE 'WAREHOUSE%';

-- 7. LOCATION CODE PATTERNS
SELECT 'LOCATION_CODE_PATTERNS' as analysis_section;
SELECT 
    'self_transfer_source' as table_name,
    source_location as location,
    COUNT(*) as count
FROM self_transfer
GROUP BY source_location

UNION ALL

SELECT 
    'self_transfer_destination' as table_name,
    destination_location as location,
    COUNT(*) as count
FROM self_transfer
GROUP BY destination_location

UNION ALL

SELECT 
    'inventory_ledger_base' as table_name,
    location_code as location,
    COUNT(*) as count
FROM inventory_ledger_base
WHERE movement_type = 'SELF_TRANSFER'
GROUP BY location_code

ORDER BY table_name, count DESC;

-- 8. SAMPLE RECENT TRANSFERS
SELECT 'RECENT_TRANSFERS_SAMPLE' as analysis_section;
SELECT 
    st.transfer_reference,
    st.transfer_type,
    st.source_location,
    st.destination_location,
    st.status,
    st.created_at,
    COUNT(sti.id) as item_count
FROM self_transfer st
LEFT JOIN self_transfer_items sti ON st.id = sti.transfer_id
GROUP BY st.id
ORDER BY st.created_at DESC
LIMIT 10;