# Test what the orders API is returning
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@18.143.133.96"

Write-Host "Testing orders API response..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking the actual order data in database:" -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER @"
sudo mysql inventory_db -e "
SELECT 
    o.id,
    o.order_number,
    (SELECT GROUP_CONCAT(CONCAT(product_name, ' (', quantity, ')') SEPARATOR ', ')
     FROM website_order_items 
     WHERE order_id = o.id) as products
FROM website_orders o
ORDER BY o.created_at DESC
LIMIT 5;
"
"@

Write-Host ""
Write-Host "Checking backend controller file on server:" -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "grep -A 10 'Fetch product details' ~/inventoryfullstack/controllers/websiteOrderController.js"

Write-Host ""
Write-Host "Testing API directly with curl:" -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "curl -s http://localhost:5000/api/website/orders?page=1&limit=1 | python3 -m json.tool"
