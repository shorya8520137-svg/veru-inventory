#!/usr/bin/env pwsh

$SERVER = "ubuntu@18.141.230.43"
$KEY = "C:\Users\Public\e2c.pem.pem"

ssh -i $KEY $SERVER @"
sudo mysql inventory_db -e "
SELECT 
    o.id,
    o.order_number,
    o.user_id,
    o.created_at
FROM website_orders 
ORDER BY o.created_at DESC
LIMIT 5;
"

echo ""
echo "=== Testing JOIN ==="
sudo mysql inventory_db -e "
SELECT 
    o.order_number,
    o.user_id,
    wc.id as customer_id,
    wc.name,
    wc.email
FROM website_orders o
LEFT JOIN website_customers wc ON CAST(o.user_id AS UNSIGNED) = wc.id
ORDER BY o.created_at DESC
LIMIT 5;
"
"@
