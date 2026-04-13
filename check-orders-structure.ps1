#!/usr/bin/env pwsh

Write-Host "=== Checking Orders Database Structure ===" -ForegroundColor Cyan

$SERVER = "ubuntu@13.212.38.57"
$KEY = "C:\Users\Public\e2c.pem.pem"

ssh -i $KEY $SERVER @"
mysql -u root -p'Root@12345' inventory_db -e "
DESCRIBE website_orders;
"

echo ""
echo "=== Sample Orders Data ==="
mysql -u root -p'Root@12345' inventory_db -e "
SELECT id, order_number, user_id, customer_id, created_at 
FROM website_orders 
LIMIT 5;
"

echo ""
echo "=== Check if customer_id column exists ==="
mysql -u root -p'Root@12345' inventory_db -e "
SHOW COLUMNS FROM website_orders LIKE 'customer_id';
"
"@
