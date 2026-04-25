# PowerShell script to analyze inventory-related tables

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "🔍 Analyzing Inventory Database Structure..." -ForegroundColor Cyan
Write-Host ""

# Get all tables
Write-Host "📋 All Tables in inventory_db:" -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "SHOW TABLES;"
"@

Write-Host ""
Write-Host "=" * 80
Write-Host ""

# Analyze inventory table
Write-Host "📦 INVENTORY Table Structure:" -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "DESCRIBE inventory;"
"@

Write-Host ""
Write-Host "📊 INVENTORY Row Count:"
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "SELECT COUNT(*) as total_rows FROM inventory;"
"@

Write-Host ""
Write-Host "=" * 80
Write-Host ""

# Analyze timeline table
Write-Host "⏱️  TIMELINE Table Structure:" -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "DESCRIBE timeline;"
"@

Write-Host ""
Write-Host "📊 TIMELINE Row Count:"
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "SELECT COUNT(*) as total_rows FROM timeline;"
"@

Write-Host ""
Write-Host "=" * 80
Write-Host ""

# Analyze self_transfer table
Write-Host "🔄 SELF_TRANSFER Table Structure:" -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "DESCRIBE self_transfer;"
"@

Write-Host ""
Write-Host "📊 SELF_TRANSFER Row Count:"
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "SELECT COUNT(*) as total_rows FROM self_transfer;"
"@

Write-Host ""
Write-Host "=" * 80
Write-Host ""

# Analyze stock_batches table
Write-Host "📦 STOCK_BATCHES Table Structure:" -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "DESCRIBE stock_batches;"
"@

Write-Host ""
Write-Host "📊 STOCK_BATCHES Row Count:"
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "SELECT COUNT(*) as total_rows FROM stock_batches;"
"@

Write-Host ""
Write-Host "=" * 80
Write-Host ""

# Analyze store_inventory table
Write-Host "🏪 STORE_INVENTORY Table Structure:" -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "DESCRIBE store_inventory;"
"@

Write-Host ""
Write-Host "📊 STORE_INVENTORY Row Count:"
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "SELECT COUNT(*) as total_rows FROM store_inventory;"
"@

Write-Host ""
Write-Host "✅ Analysis Complete!" -ForegroundColor Green
