# PowerShell script to analyze products issue on server
$serverIP = "13.212.51.226"
$keyPath = "C:\Users\Public\e2c.pem.pem"
$user = "ubuntu"

Write-Host "=========================================="
Write-Host "Connecting to server and analyzing database..."
Write-Host "=========================================="
Write-Host ""

# Run commands on server via SSH
$commands = @"
sudo mysql inventory_db -e 'SHOW TABLES;' && 
echo '' && 
echo '=== Tables with product in name ===' && 
sudo mysql inventory_db -e 'SHOW TABLES LIKE \"%product%\";' && 
echo '' && 
echo '=== Product IDs used in orders ===' && 
sudo mysql inventory_db -e 'SELECT DISTINCT product_id FROM website_order_items ORDER BY product_id;' && 
echo '' && 
echo '=== Current products table ===' && 
sudo mysql inventory_db -e 'SELECT product_id, product_name, sku FROM products LIMIT 10;'
"@

ssh -i $keyPath "$user@$serverIP" $commands

Write-Host ""
Write-Host "=========================================="
Write-Host "Analysis complete! Share the output above."
Write-Host "=========================================="
