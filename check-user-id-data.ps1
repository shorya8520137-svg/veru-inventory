#!/usr/bin/env pwsh

Write-Host "=== Checking user_id Data in Orders ===" -ForegroundColor Cyan

$SERVER = "ubuntu@18.141.230.43"
$KEY = "C:\Users\Public\e2c.pem.pem"

ssh -i $KEY $SERVER @"
echo "=== Sample Orders with user_id ==="
sudo mysql inventory_db -e "
SELECT id, order_number, user_id, created_at 
FROM website_orders 
LIMIT 5;
"

echo ""
echo "=== Try to Join with website_customers ==="
sudo mysql inventory_db -e "
SELECT 
    o.id,
    o.order_number,
    o.user_id,
    wc.id as customer_id,
    wc.name as customer_name,
    wc.email as customer_email,
    wc.phone as customer_phone
FROM website_orders o
LEFT JOIN website_customers wc ON CAST(o.user_id AS UNSIGNED) = wc.id
LIMIT 3;
"
"@
