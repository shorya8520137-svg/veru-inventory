#!/usr/bin/env pwsh

Write-Host "=== Deploying Email Fix to Server ===" -ForegroundColor Cyan

# Server details
$SERVER = "ubuntu@18.141.230.43"
$KEY = "C:\Users\Public\e2c.pem.pem"
$REMOTE_PATH = "/home/ubuntu/inventoryfullstack"

Write-Host "`n1. Uploading fixed websiteOrderController.js..." -ForegroundColor Yellow
scp -i $KEY controllers/websiteOrderController.js "${SERVER}:${REMOTE_PATH}/controllers/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload file!" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Restarting backend server..." -ForegroundColor Yellow
ssh -i $KEY $SERVER @"
cd $REMOTE_PATH
pm2 restart server || pm2 start server.js --name server
pm2 logs server --lines 20
"@

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Changes deployed:" -ForegroundColor Cyan
Write-Host "  - Fixed email display - now joins with website_customers using user_id" -ForegroundColor Green
Write-Host "  - Fixed JSON parsing error for customization field" -ForegroundColor Green
Write-Host "  - Email now shows from website_customers table" -ForegroundColor Green
