#!/usr/bin/env pwsh

Write-Host "=== Fixing Website Orders JSON Parse Error ===" -ForegroundColor Cyan
Write-Host ""

$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$keyPath = "C:\Users\Public\e2c.pem.pem"
$remoteProjectPath = "/home/ubuntu/inventoryfullstack"

# Step 1: Upload fixed controller
Write-Host "Step 1: Uploading fixed websiteOrderController.js..." -ForegroundColor Yellow
scp -i $keyPath controllers/websiteOrderController.js "${serverUser}@${serverIP}:${remoteProjectPath}/controllers/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload controller file" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Controller uploaded successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Restart backend server
Write-Host "Step 2: Restarting backend server..." -ForegroundColor Yellow
ssh -i $keyPath "${serverUser}@${serverIP}" "cd $remoteProjectPath && pm2 restart all"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restart server" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Server restarted successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Check server status
Write-Host "Step 3: Checking server status..." -ForegroundColor Yellow
ssh -i $keyPath "${serverUser}@${serverIP}" "pm2 status"

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Fixed: JSON parsing error in websiteOrderController.js line 846" -ForegroundColor Cyan
Write-Host "✅ Now checks if customization is already an object before parsing" -ForegroundColor Cyan
Write-Host "✅ Added try-catch for safety" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Test the website orders API at https://api.giftgala.in/api/website/orders" -ForegroundColor Yellow
