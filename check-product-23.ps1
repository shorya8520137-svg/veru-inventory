# Check if product 23 exists
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.51.226"

Write-Host "Checking product 23..." -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT * FROM website_products WHERE id = 23;'"

Write-Host "`nAll products in website_products:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "sudo mysql inventory_db -e 'SELECT id, product_name, sku, is_active FROM website_products ORDER BY id;'"
