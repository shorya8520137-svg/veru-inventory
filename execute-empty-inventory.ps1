# PowerShell script to execute empty inventory SQL on server

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "⚠️  WARNING: This will EMPTY all inventory-related tables!" -ForegroundColor Red
Write-Host "Tables to be emptied:" -ForegroundColor Yellow
Write-Host "  - inventory" -ForegroundColor White
Write-Host "  - timeline" -ForegroundColor White
Write-Host "  - self_transfer" -ForegroundColor White
Write-Host "  - stock_batches" -ForegroundColor White
Write-Host "  - store_inventory" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Type 'YES' to proceed with emptying inventory system"

if ($confirmation -ne "YES") {
    Write-Host "❌ Operation cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📤 Uploading SQL script to server..." -ForegroundColor Cyan

# Upload the SQL file to server
scp -i $sshKey "empty-inventory-system.sql" "${sshHost}:/tmp/empty-inventory-system.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload SQL file!" -ForegroundColor Red
    exit
}

Write-Host "✅ SQL file uploaded successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🗑️  Executing empty inventory script on server..." -ForegroundColor Yellow
Write-Host ""

# Execute the SQL script on server
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db < /tmp/empty-inventory-system.sql
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Inventory system emptied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧹 Cleaning up temp file on server..." -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo rm /tmp/empty-inventory-system.sql"
    Write-Host "✅ Done!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to execute SQL script!" -ForegroundColor Red
    Write-Host "Temp file location: /tmp/empty-inventory-system.sql" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Verifying table counts..." -ForegroundColor Cyan
Write-Host ""

# Verify the tables are empty
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "
SELECT 
    'inventory' as table_name, COUNT(*) as row_count FROM inventory
UNION ALL
SELECT 
    'timeline' as table_name, COUNT(*) as row_count FROM timeline
UNION ALL
SELECT 
    'self_transfer' as table_name, COUNT(*) as row_count FROM self_transfer
UNION ALL
SELECT 
    'stock_batches' as table_name, COUNT(*) as row_count FROM stock_batches
UNION ALL
SELECT 
    'store_inventory' as table_name, COUNT(*) as row_count FROM store_inventory;
"
"@

Write-Host ""
Write-Host "✅ Operation completed!" -ForegroundColor Green
