USE inventory_db;

-- Check if sample data already exists
SET @count = (SELECT COUNT(*) FROM website_orders WHERE order_number LIKE 'ORD-2026-%');

-- Only insert if no sample data exists
INSERT IGNORE INTO website_orders (order_number, user_id, status, total_amount, currency, payment_status, payment_method, shipping_address, order_date) 
SELECT * FROM (
    SELECT 'ORD-2026-001' as order_number, 1 as user_id, 'Processing' as status, 1499.00 as total_amount, 'INR' as currency, 'Paid' as payment_status, 'Card' as payment_method, 
    '{"name":"Shorya Singh","email":"singhshorya997@gmail.com","phone":"+91-9876543210","addressLine1":"123 Main Street","city":"Bangalore","state":"Karnataka","postalCode":"560001","country":"India"}' as shipping_address, 
    NOW() as order_date
    UNION ALL
    SELECT 'ORD-2026-002', 1, 'Pending', 2998.00, 'INR', 'Pending', 'COD',
    '{"name":"Preet Rana","email":"preet@example.com","phone":"+91-9876543211","addressLine1":"456 Park Avenue","city":"Mumbai","state":"Maharashtra","postalCode":"400001","country":"India"}',
    NOW()
) AS tmp
WHERE @count = 0;

-- Get order IDs
SET @order1_id = (SELECT id FROM website_orders WHERE order_number = 'ORD-2026-001' LIMIT 1);
SET @order2_id = (SELECT id FROM website_orders WHERE order_number = 'ORD-2026-002' LIMIT 1);

-- Insert order items if orders exist
INSERT IGNORE INTO website_order_items (order_id, product_name, quantity, unit_price, total_price)
SELECT * FROM (
    SELECT @order1_id as order_id, 'Premium Wireless Headphones' as product_name, 1 as quantity, 1499.00 as unit_price, 1499.00 as total_price
    UNION ALL
    SELECT @order2_id, 'Bluetooth Speaker', 1, 1200.00, 1200.00
    UNION ALL
    SELECT @order2_id, 'USB Cable - Type C', 3, 599.33, 1798.00
) AS tmp
WHERE @order1_id IS NOT NULL;

-- Show results
SELECT 'Total Orders' as info, COUNT(*) as count FROM website_orders;
SELECT 'Total Items' as info, COUNT(*) as count FROM website_order_items;

-- Show sample data with customer info
SELECT 
    o.order_number,
    o.status,
    o.total_amount,
    o.payment_method,
    o.shipping_address,
    COUNT(oi.id) as item_count
FROM website_orders o
LEFT JOIN website_order_items oi ON o.id = oi.order_id
GROUP BY o.id
LIMIT 5;
