#!/usr/bin/env pwsh

Write-Host "=== Checking Database Structure ===" -ForegroundColor Cyan

$SERVER = "ubuntu@18.141.230.43"
$KEY = "C:\Users\Public\e2c.pem.pem"

ssh -i $KEY $SERVER @"
echo "=== Website Orders Table Structure ==="
sudo mysql inventory_db -e "DESCRIBE website_orders;"

echo ""
echo "=== Sample Orders Data (checking user_id and customer_id) ==="
sudo mysql inventory_db -e "
SELECT id, order_number, user_id, customer_id, created_at 
FROM website_orders 
LIMIT 5;
"

echo ""
echo "=== Website Customers Table ==="
sudo mysql inventory_db -e "
SELECT id, name, email, phone 
FROM website_customers 
LIMIT 5;
"

echo ""
echo "=== Check Join Relationship ==="
sudo mysql inventory_db -e "
SELECT 
    o.id,
    o.order_number,
    o.user_id,
    o.customer_id,
    wc.name as customer_name,
    wc.email as customer_email,
    wc.phone as customer_phone
FROM website_orders o
LEFT JOIN website_customers wc ON o.customer_id = wc.id
LIMIT 3;
"
"@
