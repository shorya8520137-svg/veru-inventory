-- Check if website_orders table exists and what data it has
SELECT 
    'Table Structure' as info,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'website_orders'
ORDER BY ORDINAL_POSITION;

-- Check sample data from website_orders
SELECT 
    id,
    order_number,
    status,
    total_amount,
    shipping_address,
    created_at
FROM website_orders
LIMIT 5;

-- Check if website_order_items table exists
SELECT 
    'Order Items' as info,
    COUNT(*) as total_items
FROM website_order_items;

-- Check sample order with items
SELECT 
    o.id,
    o.order_number,
    o.shipping_address,
    oi.product_name,
    oi.quantity,
    oi.unit_price
FROM website_orders o
LEFT JOIN website_order_items oi ON o.id = oi.order_id
LIMIT 10;
