# Deploy Store Inventory Fix
# This script deploys the billing-triggered stock reduction fix for store-to-store transfers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Store Inventory Fix Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Backup current routes
Write-Host "Step 1: Backing up current selfTransferRoutes.js..." -ForegroundColor Yellow
if (Test-Path "routes/selfTransferRoutes.js") {
    Copy-Item "routes/selfTransferRoutes.js" "routes/selfTransferRoutes.BACKUP.js" -Force
    Write-Host "✅ Backup created: routes/selfTransferRoutes.BACKUP.js" -ForegroundColor Green
} else {
    Write-Host "❌ routes/selfTransferRoutes.js not found!" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy new routes
Write-Host ""
Write-Host "Step 2: Deploying new selfTransferRoutes.js..." -ForegroundColor Yellow
if (Test-Path "routes/selfTransferRoutes.NEW.js") {
    Copy-Item "routes/selfTransferRoutes.NEW.js" "routes/selfTransferRoutes.js" -Force
    Write-Host "✅ New routes deployed" -ForegroundColor Green
} else {
    Write-Host "❌ routes/selfTransferRoutes.NEW.js not found!" -ForegroundColor Red
    exit 1
}

# Step 3: Verify services exist
Write-Host ""
Write-Host "Step 3: Verifying services..." -ForegroundColor Yellow
$services = @(
    "services/StockReductionService.js",
    "services/TimelineService.js",
    "services/BillingIntegrationService.js",
    "repositories/StockBatchRepository.js",
    "routes/storeTimelineRoutes.js"
)

$allServicesExist = $true
foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "✅ $service" -ForegroundColor Green
    } else {
        Write-Host "❌ $service NOT FOUND" -ForegroundColor Red
        $allServicesExist = $false
    }
}

if (-not $allServicesExist) {
    Write-Host ""
    Write-Host "❌ Some services are missing. Deployment aborted." -ForegroundColor Red
    exit 1
}

# Step 4: Check database migration
Write-Host ""
Write-Host "Step 4: Database migration check..." -ForegroundColor Yellow
if (Test-Path "migrations/create_store_timeline_table.sql") {
    Write-Host "✅ Migration file found: migrations/create_store_timeline_table.sql" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: You need to run the database migration manually:" -ForegroundColor Yellow
    Write-Host "   mysql -u username -p database_name < migrations/create_store_timeline_table.sql" -ForegroundColor Cyan
    Write-Host ""
    $runMigration = Read-Host "Have you run the database migration? (yes/no)"
    if ($runMigration -ne "yes") {
        Write-Host "❌ Please run the database migration first, then re-run this script." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Migration file not found!" -ForegroundColor Red
    exit 1
}

# Step 5: Verify server.js has storeTimelineRoutes registered
Write-Host ""
Write-Host "Step 5: Verifying server.js configuration..." -ForegroundColor Yellow
$serverContent = Get-Content "server.js" -Raw
if ($serverContent -match "storeTimelineRoutes") {
    Write-Host "✅ storeTimelineRoutes registered in server.js" -ForegroundColor Green
} else {
    Write-Host "⚠️  storeTimelineRoutes not found in server.js" -ForegroundColor Yellow
    Write-Host "   Adding route registration..." -ForegroundColor Yellow
    
    # Find the line with timelineRoutes and add storeTimelineRoutes after it
    $serverLines = Get-Content "server.js"
    $newLines = @()
    foreach ($line in $serverLines) {
        $newLines += $line
        if ($line -match "app\.use\('/api/timeline'") {
            $newLines += ""
            $newLines += "// store timeline routes"
            $newLines += "app.use('/api/store-timeline', require('./routes/storeTimelineRoutes'));"
        }
    }
    $newLines | Set-Content "server.js"
    Write-Host "✅ Route registration added to server.js" -ForegroundColor Green
}

# Step 6: Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Routes backed up" -ForegroundColor Green
Write-Host "✅ New routes deployed" -ForegroundColor Green
Write-Host "✅ Services verified" -ForegroundColor Green
Write-Host "✅ Database migration confirmed" -ForegroundColor Green
Write-Host "✅ Server configuration verified" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Restart the application:" -ForegroundColor Yellow
Write-Host "   npm run start" -ForegroundColor Cyan
Write-Host "   OR" -ForegroundColor Cyan
Write-Host "   pm2 restart veru-inventory" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Test the deployment:" -ForegroundColor Yellow
Write-Host "   - Test timeline API: GET /api/store-timeline/GURUGRAM-NH48" -ForegroundColor Cyan
Write-Host "   - Test store transfer: POST /api/self-transfer" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Monitor logs for:" -ForegroundColor Yellow
Write-Host "   - ✅ Billing entry created" -ForegroundColor Cyan
Write-Host "   - ✅ Stock transfer completed" -ForegroundColor Cyan
Write-Host "   - ✅ Timeline entries created" -ForegroundColor Cyan
Write-Host "   - ✅ Transaction committed successfully" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Rollback if needed:" -ForegroundColor Yellow
Write-Host "   Copy-Item routes/selfTransferRoutes.BACKUP.js routes/selfTransferRoutes.js -Force" -ForegroundColor Cyan
Write-Host "   pm2 restart veru-inventory" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
