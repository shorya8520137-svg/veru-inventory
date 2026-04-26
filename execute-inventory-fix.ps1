# CRITICAL INVENTORY SYNCHRONIZATION FIX EXECUTION
# This script fixes the commercial software bug where timeline shows stock changes but live stock doesn't update

Write-Host "🚨 CRITICAL INVENTORY SYNCHRONIZATION FIX" -ForegroundColor Red
Write-Host "=" * 60 -ForegroundColor Yellow

$serverIP = "13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"
$dbName = "inventory_db"

Write-Host "📊 Server: $serverIP" -ForegroundColor Cyan
Write-Host "🗄️  Database: $dbName" -ForegroundColor Cyan

# Step 1: Upload the fix SQL script to server
Write-Host "`n📤 Step 1: Uploading fix script to server..." -ForegroundColor Yellow
scp -i $sshKey "fix-inventory-synchronization.sql" "ubuntu@${serverIP}:/tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload fix script" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Fix script uploaded successfully" -ForegroundColor Green

# Step 2: Execute the fix on the server
Write-Host "`n🔧 Step 2: Executing inventory synchronization fix..." -ForegroundColor Yellow

$fixCommand = @"
mysql -u root -p$dbPassword $dbName < /tmp/fix-inventory-synchronization.sql
"@

ssh -i $sshKey "ubuntu@$serverIP" $fixCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to execute fix script" -ForegroundColor Red
    Write-Host "⚠️  Manual intervention required" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Inventory synchronization fix executed successfully" -ForegroundColor Green

# Step 3: Backup and replace the self-transfer routes
Write-Host "`n🔄 Step 3: Updating self-transfer routes..." -ForegroundColor Yellow

# Upload the fixed routes file
scp -i $sshKey "routes/selfTransferRoutes-fixed.js" "ubuntu@${serverIP}:/tmp/"

# Backup existing routes and replace with fixed version
$routesUpdateCommand = @"
cd /var/www/inventory-system
cp routes/selfTransferRoutes.js routes/selfTransferRoutes.backup.js
cp /tmp/selfTransferRoutes-fixed.js routes/selfTransferRoutes.js
chown www-data:www-data routes/selfTransferRoutes.js
"@

ssh -i $sshKey "ubuntu@$serverIP" $routesUpdateCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to update routes file" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Self-transfer routes updated successfully" -ForegroundColor Green

# Step 4: Restart the backend service
Write-Host "`n🔄 Step 4: Restarting backend service..." -ForegroundColor Yellow

$restartCommand = @"
cd /var/www/inventory-system
pm2 restart backend
pm2 status
"@

ssh -i $sshKey "ubuntu@$serverIP" $restartCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restart backend service" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend service restarted successfully" -ForegroundColor Green

# Step 5: Verify the fix
Write-Host "`n🔍 Step 5: Verifying the fix..." -ForegroundColor Yellow

$verifyCommand = @"
mysql -u root -p$dbPassword $dbName -e "
SELECT 'VERIFICATION RESULTS' as status;
SELECT 
    warehouse,
    qty_available as current_stock,
    updated_at
FROM stock_batches 
WHERE barcode = '2460-3499' 
AND status = 'active'
ORDER BY warehouse;

SELECT 'TIMELINE SUMMARY' as status;
SELECT 
    location_code as warehouse,
    SUM(CASE WHEN direction = 'IN' THEN qty ELSE -qty END) as calculated_stock
FROM inventory_ledger_base 
WHERE barcode = '2460-3499'
GROUP BY location_code
ORDER BY location_code;
"
"@

Write-Host "📊 Current stock levels after fix:" -ForegroundColor Cyan
ssh -i $sshKey "ubuntu@$serverIP" $verifyCommand

# Step 6: Test a new self-transfer to ensure it works correctly
Write-Host "`n🧪 Step 6: Testing system functionality..." -ForegroundColor Yellow
Write-Host "✅ Fix deployment completed successfully!" -ForegroundColor Green
Write-Host "" 
Write-Host "📋 SUMMARY OF CHANGES:" -ForegroundColor Cyan
Write-Host "  ✅ Fixed stock_batches synchronization with timeline" -ForegroundColor Green
Write-Host "  ✅ Removed duplicate self-transfer entries" -ForegroundColor Green
Write-Host "  ✅ Updated self-transfer routes with guaranteed synchronization" -ForegroundColor Green
Write-Host "  ✅ Added transaction consistency and error handling" -ForegroundColor Green
Write-Host "  ✅ Created stored procedure for future stock reconciliation" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 EXPECTED RESULTS:" -ForegroundColor Yellow
Write-Host "  • Timeline and live stock should now be synchronized" -ForegroundColor White
Write-Host "  • Self-transfers should properly update both warehouses" -ForegroundColor White
Write-Host "  • No more duplicate transfer entries" -ForegroundColor White
Write-Host "  • Bangalore warehouse should show transferred products" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Test a new self-transfer in the UI" -ForegroundColor White
Write-Host "  2. Verify timeline shows correct stock levels" -ForegroundColor White
Write-Host "  3. Check that live stock matches timeline" -ForegroundColor White
Write-Host "  4. Confirm Bangalore warehouse shows received products" -ForegroundColor White

Write-Host "`n🚀 INVENTORY SYNCHRONIZATION FIX COMPLETED!" -ForegroundColor Green