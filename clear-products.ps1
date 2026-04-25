# Clear products table on remote server
# This script connects via SSH and clears only dispatch_product table

$sshKey = "C:\Users\singh\.ssh\pem.pem"
$server = "ubuntu@13.212.82.157"

Write-Host "Connecting to server to clear products table..." -ForegroundColor Yellow
Write-Host "This will NOT affect website products!" -ForegroundColor Green

# Upload the SQL script
Write-Host "`nUploading SQL script..." -ForegroundColor Cyan
scp -i $sshKey "clear-products-safe.sql" "${server}:/tmp/clear-products.sql"

# Execute the SQL script
Write-Host "`nExecuting SQL script..." -ForegroundColor Cyan
ssh -i $sshKey $server "sudo mysql inventory_db < /tmp/clear-products.sql"

Write-Host "`nProducts table cleared!" -ForegroundColor Green
Write-Host "Website products remain intact." -ForegroundColor Green

# Clean up
ssh -i $sshKey $server "rm /tmp/clear-products.sql"

Write-Host "`nDone!" -ForegroundColor Green
