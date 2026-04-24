-- SELF-TRANSFER BILLING ANALYSIS
-- Understanding how self-transfers should be documented in bills table

-- 1. Check existing self-transfer related bills
SELECT 'EXISTING_SELF_TRANSFER_BILLS' as analysis_section;
SELECT 
    invoice_number,
    bill_type,
    customer_name,
    customer_phone,
    payment_mode,
    payment_status,
    subtotal,
    grand_total,
    total_items,
    created_at,
    SUBSTRING(items, 1, 200) as items_preview
FROM bills 
WHERE bill_type LIKE '%transfer%' 
   OR payment_mode = 'transfer'
   OR customer_name LIKE '%Transfer%'
   OR invoice_number LIKE 'TRF_%'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check all bill types to understand patterns
SELECT 'ALL_BILL_TYPES' as analysis_section;
SELECT 
    bill_type,
    payment_mode,
    COUNT(*) as count,
    AVG(grand_total) as avg_amount,
    MIN(created_at) as first_bill,
    MAX(created_at) as last_bill
FROM bills 
GROUP BY bill_type, payment_mode
ORDER BY count DESC;

-- 3. Check customer name patterns for internal operations
SELECT 'INTERNAL_OPERATION_PATTERNS' as analysis_section;
SELECT 
    customer_name,
    bill_type,
    payment_mode,
    COUNT(*) as count
FROM bills 
WHERE customer_name LIKE '%Store%'
   OR customer_name LIKE '%Warehouse%'
   OR customer_name LIKE '%Transfer%'
   OR customer_name LIKE '%Internal%'
   OR customer_phone = 'INTERNAL'
GROUP BY customer_name, bill_type, payment_mode
ORDER BY count DESC;

-- 4. Analyze items structure in bills for transfers
SELECT 'TRANSFER_ITEMS_STRUCTURE' as analysis_section;
SELECT 
    invoice_number,
    customer_name,
    items
FROM bills 
WHERE (bill_type LIKE '%transfer%' OR payment_mode = 'transfer')
  AND items IS NOT NULL
LIMIT 5;

-- 5. Check if there are existing self_transfer records
SELECT 'SELF_TRANSFER_RECORDS' as analysis_section;
SELECT 
    transfer_reference,
    transfer_type,
    source_location,
    destination_location,
    status,
    created_at
FROM self_transfer
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check relationship between self_transfer and bills
SELECT 'SELF_TRANSFER_BILLS_RELATIONSHIP' as analysis_section;
SELECT 
    st.transfer_reference,
    st.transfer_type,
    st.source_location,
    st.destination_location,
    b.bill_type,
    b.customer_name,
    b.payment_mode,
    b.grand_total
FROM self_transfer st
LEFT JOIN bills b ON b.invoice_number = st.transfer_reference
ORDER BY st.created_at DESC
LIMIT 10;

-- 7. Company/Store information for proper naming
SELECT 'STORE_LOCATION_INFO' as analysis_section;
SELECT DISTINCT
    source_location as location,
    'source' as type,
    COUNT(*) as usage_count
FROM self_transfer
GROUP BY source_location

UNION ALL

SELECT DISTINCT
    destination_location as location,
    'destination' as type,
    COUNT(*) as usage_count
FROM self_transfer
GROUP BY destination_location

ORDER BY usage_count DESC;

-- 8. Check if there are company/store master tables
SELECT 'AVAILABLE_TABLES' as analysis_section;
SHOW TABLES LIKE '%store%';

SELECT 'AVAILABLE_TABLES_WAREHOUSE' as analysis_section;
SHOW TABLES LIKE '%warehouse%';

SELECT 'AVAILABLE_TABLES_COMPANY' as analysis_section;
SHOW TABLES LIKE '%company%';

-- 9. Sample self_transfer_items to understand structure
SELECT 'SELF_TRANSFER_ITEMS_SAMPLE' as analysis_section;
SELECT 
    sti.transfer_id,
    sti.product_name,
    sti.barcode,
    sti.qty,
    st.transfer_reference,
    st.transfer_type,
    st.source_location,
    st.destination_location
FROM self_transfer_items sti
JOIN self_transfer st ON sti.transfer_id = st.id
ORDER BY sti.id DESC
LIMIT 10;