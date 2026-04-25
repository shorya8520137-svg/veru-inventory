# Execute empty inventory SQL on server - FAST VERSION

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "WARNING: This will EMPTY all inventory tables!" -ForegroundColor Red
Write-Host ""
Write-Host "Tables to be emptied:" -ForegroundColor Yellow
Write-Host "  - inventory" -ForegroundColor White
Write-Host "  - inventory_adjustments" -ForegroundColor White
Write-Host "  - inventory_daily_snapshot" -ForegroundColor White
Write-Host "  - inventory_ledger_base" -ForegroundColor White
Write-Host "  - inventory_snapshots" -ForegroundColor White
Write-Host "  - self_transfer" -ForegroundColor White
Write-Host "  - self_transfer_items" -ForegroundColor White
Write-Host "  - stock_batches" -ForegroundColor White
Write-Host "  - stock_transactions" -ForegroundColor White
Write-Host "  - store_inventory" -ForegroundColor White
Write-Host "  - store_inventory_logs" -ForegroundColor White
Write-Host "  - storeinventory" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Type 'YES' to proceed"

if ($confirmation -ne "YES") {
    Write-Host "Operation cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Uploading SQL script..." -ForegroundColor Cyan
scp -i $sshKey "empty-inventory-system.sql" "${sshHost}:/tmp/empty-inventory-system.sql"

Write-Host "Executing empty inventory script..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo mysql inventory_db < /tmp/empty-inventory-system.sql"

Write-Host "Cleaning up..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo rm /tmp/empty-inventory-system.sql"

Write-Host ""
Write-Host "Done! All inventory tables emptied." -ForegroundColor Green