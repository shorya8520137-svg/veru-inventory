#!/usr/bin/env pwsh

Write-Host "=== Deploying Website Orders Improvements ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Git commit and push
Write-Host "Step 1: Committing changes to Git..." -ForegroundColor Yellow
git add .
git commit -m "Fix website orders: address modal, status dropdown, email extraction improvements"
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy backend to server
Write-Host "Step 2: Deploying backend to server..." -ForegroundColor Yellow

$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$keyPath = "C:\Users\Public\e2c.pem.pem"
$remoteProjectPath = "/home/ubuntu/inventoryfullstack"

# Upload controller
scp -i $keyPath controllers/websiteOrderController.js "${serverUser}@${serverIP}:${remoteProjectPath}/controllers/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload controller" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend uploaded" -ForegroundColor Green
Write-Host ""

# Step 3: Restart backend
Write-Host "Step 3: Restarting backend server..." -ForegroundColor Yellow
ssh -i $keyPath "${serverUser}@${serverIP}" "cd $remoteProjectPath && pm2 restart all"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restart server" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend restarted" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy frontend to Vercel
Write-Host "Step 4: Building and deploying frontend to Vercel..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend deployed to Vercel" -ForegroundColor Green
Write-Host ""

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 IMPROVEMENTS DEPLOYED:" -ForegroundColor Cyan
Write-Host "  ✅ Address modal - click address to see full details" -ForegroundColor White
Write-Host "  ✅ Status dropdown - update order status with multiple options" -ForegroundColor White
Write-Host "  ✅ Email extraction - improved to handle multiple field name variations" -ForegroundColor White
Write-Host "  ✅ Phone extraction - improved field name detection" -ForegroundColor White
Write-Host "  ✅ Currency symbol - changed from USD to ₹" -ForegroundColor White
Write-Host ""
Write-Host "📋 STATUS OPTIONS AVAILABLE:" -ForegroundColor Yellow
Write-Host "  - Pending" -ForegroundColor White
Write-Host "  - Confirmed" -ForegroundColor White
Write-Host "  - Payment Verification" -ForegroundColor White
Write-Host "  - Processing" -ForegroundColor White
Write-Host "  - Shipped" -ForegroundColor White
Write-Host "  - In Transit" -ForegroundColor White
Write-Host "  - Out For Delivery" -ForegroundColor White
Write-Host "  - Delivered" -ForegroundColor White
Write-Host "  - Cancelled" -ForegroundColor White
Write-Host "  - Refunded" -ForegroundColor White
Write-Host ""
Write-Host "🔍 DEBUGGING:" -ForegroundColor Yellow
Write-Host "  - Backend now logs shipping_address JSON structure" -ForegroundColor White
Write-Host "  - Check server logs to see actual field names in your orders" -ForegroundColor White
Write-Host ""
Write-Host "Next: Test by placing a new order and check if email appears" -ForegroundColor Cyan
