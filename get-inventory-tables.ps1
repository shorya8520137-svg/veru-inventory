# Get inventory table details

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "Getting inventory table row counts..." -ForegroundColor Cyan
Write-Host ""

# Check main inventory tables
$inventoryTables = @(
    "inventory",
    "inventory_adjustments", 
    "inventory_daily_snapshot",
    "inventory_ledger_base",
    "inventory_snapshots",
    "self_transfer",
    "self_transfer_items", 
    "stock_batches",
    "stock_transactions",
    "store_inventory",
    "store_inventory_logs",
    "storeinventory"
)

foreach ($table in $inventoryTables) {
    Write-Host "=== $table ===" -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT COUNT(*) as row_count FROM $table;'"
    Write-Host ""
}

Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host "Tables found that contain inventory data:" -ForegroundColor White
foreach ($table in $inventoryTables) {
    Write-Host "  - $table" -ForegroundColor Cyan
}