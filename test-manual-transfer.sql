-- Manual Self Transfer Test
-- Test W to S transfer with inventory and billing verification

-- Step 1: Check current state
SELECT 'BEFORE TRANSFER - Warehouse Inventory' as step;
SELECT product, code, stock, warehouse FROM inventory WHERE stock > 0 LIMIT 3;

SELECT 'BEFORE TRANSFER - Store Inventory for barcode 2460-3499' as step;
SELECT product_name, barcode, stock FROM store_inventory WHERE barcode = '2460-3499';

SELECT 'BEFORE TRANSFER - Transfer Count' as step;
SELECT COUNT(*) as transfer_count FROM self_transfer;

SELECT 'BEFORE TRANSFER - Bills Count' as step;
SELECT COUNT(*) as bills_count FROM bills;

-- Step 2: Create transfer record
INSERT INTO self_transfer (
    transfer_reference, 
    transfer_type, 
    source_location, 
    destination_location, 
    remarks, 
    status, 
    created_at
) VALUES (
    'TEST_MANUAL_W2S_001', 
    'W to S', 
    'BLR_WH', 
    'GGM_MGF_MALL', 
    'Manual test W to S transfer', 
    'Completed', 
    NOW()
);

-- Get the transfer ID
SET @transfer_id = LAST_INSERT_ID();

-- Step 3: Insert transfer item
INSERT INTO self_transfer_items (
    transfer_id, 
    product_name, 
    barcode, 
    qty
) VALUES (
    @transfer_id, 
    'Unknown Product', 
    '2460-3499', 
    2
);

-- Step 4: Update store inventory (create or update)
INSERT INTO store_inventory (
    product_name, 
    barcode, 
    category, 
    stock, 
    price, 
    gst_percentage, 
    created_at, 
    last_updated
) VALUES (
    'Unknown Product', 
    '2460-3499', 
    'Transferred', 
    2, 
    0.00, 
    18.00, 
    NOW(), 
    NOW()
) ON DUPLICATE KEY UPDATE 
    stock = stock + 2, 
    last_updated = NOW();

-- Step 5: Create billing history
INSERT INTO bills (
    invoice_number, 
    bill_type, 
    customer_name, 
    customer_phone, 
    subtotal, 
    grand_total, 
    payment_mode, 
    payment_status, 
    items, 
    total_items, 
    created_at
) VALUES (
    'TEST_MANUAL_W2S_001', 
    'B2B', 
    'Transfer: BLR_WH → GGM_MGF_MALL', 
    'INTERNAL', 
    0.00, 
    0.00, 
    'transfer', 
    'paid', 
    '[{"product_name":"Unknown Product","barcode":"2460-3499","quantity":2,"price":0,"total":0}]', 
    1, 
    NOW()
);

-- Step 6: Verify results
SELECT 'AFTER TRANSFER - Transfer Record' as step;
SELECT * FROM self_transfer WHERE transfer_reference = 'TEST_MANUAL_W2S_001';

SELECT 'AFTER TRANSFER - Transfer Items' as step;
SELECT * FROM self_transfer_items WHERE transfer_id = @transfer_id;

SELECT 'AFTER TRANSFER - Updated Store Inventory' as step;
SELECT product_name, barcode, stock, last_updated FROM store_inventory WHERE barcode = '2460-3499';

SELECT 'AFTER TRANSFER - Billing History' as step;
SELECT invoice_number, customer_name, total_items, created_at FROM bills WHERE invoice_number = 'TEST_MANUAL_W2S_001';

SELECT 'TEST SUMMARY' as step;
SELECT 
    (SELECT COUNT(*) FROM self_transfer WHERE transfer_reference = 'TEST_MANUAL_W2S_001') as transfer_created,
    (SELECT COUNT(*) FROM self_transfer_items WHERE transfer_id = @transfer_id) as items_created,
    (SELECT stock FROM store_inventory WHERE barcode = '2460-3499') as store_stock,
    (SELECT COUNT(*) FROM bills WHERE invoice_number = 'TEST_MANUAL_W2S_001') as billing_created;