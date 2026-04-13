#!/usr/bin/env pwsh

Write-Host "=== Checking Order Data in Database ===" -ForegroundColor Cyan
Write-Host ""

$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$keyPath = "C:\Users\Public\e2c.pem.pem"

Write-Host "Fetching latest order data..." -ForegroundColor Yellow
Write-Host ""

$query = @"
SELECT 
    id,
    order_number,
    user_id,
    shipping_address,
    customer_email,
    customer_phone,
    customer_name
FROM website_orders 
ORDER BY created_at DESC 
LIMIT 3;
"@

ssh -i $keyPath "${serverUser}@${serverIP}" "mysql -u root inventory_db -e `"$query`""

Write-Host ""
Write-Host "=== Checking shipping_address JSON structure ===" -ForegroundColor Cyan
Write-Host ""

$jsonQuery = @"
SELECT 
    order_number,
    shipping_address
FROM website_orders 
ORDER BY created_at DESC 
LIMIT 1;
"@

ssh -i $keyPath "${serverUser}@${serverIP}" "mysql -u root inventory_db -e `"$jsonQuery`""
