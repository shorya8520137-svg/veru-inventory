# Activate products that have stock
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.51.226"

Write-Host "=== Activating Products with Stock ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Current inactive products with stock:" -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT id, product_name, stock_quantity, is_active FROM website_products WHERE is_active = 0 AND stock_quantity > 0;'"

Write-Host "`nActivating all products with stock > 0..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'UPDATE website_products SET is_active = 1 WHERE stock_quantity > 0;'"

Write-Host "`nUpdated products:" -ForegroundColor Green
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT id, product_name, stock_quantity, is_active FROM website_products WHERE is_active = 1;'"

Write-Host ""
Write-Host "=== Products Activated ===" -ForegroundColor Green
