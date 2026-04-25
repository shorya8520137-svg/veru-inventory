# PowerShell script to check product categories via SSH
$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "Checking Product Categories..." -ForegroundColor Cyan
Write-Host ""

# Check recent products
Write-Host "Recent Products:" -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT p.p_id, p.product_name, p.barcode, p.category_id, c.name AS category_name, c.display_name AS category_display_name FROM dispatch_product p LEFT JOIN product_categories c ON p.category_id = c.id WHERE p.is_active = 1 ORDER BY p.created_at DESC LIMIT 5;'"

Write-Host ""
Write-Host "All Categories:" -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT id, name, display_name, is_active FROM product_categories ORDER BY name;'"

Write-Host ""
Write-Host "Check complete!" -ForegroundColor Green
