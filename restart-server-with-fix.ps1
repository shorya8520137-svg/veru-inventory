# Restart Server with Store Timeline Fix
# This script restarts the Node.js server to load the new selfTransferRoutes

Write-Host "🔄 Restarting server with store-to-store timeline fix..." -ForegroundColor Cyan
Write-Host ""

# Check if server is running
Write-Host "📋 Checking for running Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "✅ Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Please stop your server manually (Ctrl+C in the terminal where it's running)" -ForegroundColor Yellow
    Write-Host "    Then restart it with: npm start" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 What was fixed:" -ForegroundColor Cyan
    Write-Host "   - Store-to-store transfers now create timeline entries" -ForegroundColor White
    Write-Host "   - Both source OUT and destination IN entries are logged" -ForegroundColor White
    Write-Host "   - Full integration with BillingIntegrationService" -ForegroundColor White
    Write-Host "   - Complete audit trail for store transfers" -ForegroundColor White
} else {
    Write-Host "❌ No Node.js processes found" -ForegroundColor Red
    Write-Host "   Start your server with: npm start" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 For more details, see: STORE_TO_STORE_TIMELINE_FIX.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 To test the fix:" -ForegroundColor Green
Write-Host "   1. Go to Products → Transfer Form" -ForegroundColor White
Write-Host "   2. Create a store-to-store transfer" -ForegroundColor White
Write-Host "   3. Check console logs for timeline entries" -ForegroundColor White
Write-Host "   4. View timeline in Store Inventory tab" -ForegroundColor White
Write-Host ""
