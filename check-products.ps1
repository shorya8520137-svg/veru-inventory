# Simple script to check product tables
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.51.226"

Write-Host "Checking website_products table..." -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT COUNT(*) as total FROM website_products;'"

Write-Host "`nSample from website_products:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT id, product_name, sku FROM website_products LIMIT 10;'"

Write-Host "`nChecking products table..." -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT COUNT(*) as total FROM products;'"

Write-Host "`nSample from products:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT product_id, product_name, sku FROM products LIMIT 10;'"

Write-Host "`nProduct IDs in orders:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT DISTINCT product_id FROM website_order_items ORDER BY product_id;'"

Write-Host "`nChecking website_order_items columns:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'DESCRIBE website_order_items;'"

Write-Host "`nSample order item:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT * FROM website_order_items LIMIT 1\G'"
