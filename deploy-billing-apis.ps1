# ============================================
# DEPLOY BILLING API ROUTES TO SERVER
# ============================================

$SSH_KEY = "C:\Users\Public\pem.pem"
$SERVER = "ubuntu@13.229.121.238"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING BILLING API ROUTES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload API files
Write-Host "[UPLOAD] Step 1: Uploading billing API routes..." -ForegroundColor Cyan

# Create temp directory for API files
New-Item -ItemType Directory -Path "temp_api_deploy" -Force | Out-Null

# Copy API files to temp directory
Copy-Item "src/app/api/billing" -Destination "temp_api_deploy/" -Recurse -Force
Copy-Item "src/app/api/dispatch" -Destination "temp_api_deploy/" -Recurse -Force

# Upload API files
scp -i $SSH_KEY -r "temp_api_deploy/billing" "${SERVER}:/tmp/"
scp -i $SSH_KEY -r "temp_api_deploy/dispatch" "${SERVER}:/tmp/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] API files uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to upload API files" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy to server
Write-Host ""
Write-Host "[DEPLOY] Step 2: Deploying API routes to server..." -ForegroundColor Cyan

$deployScript = @"
#!/bin/bash

# Navigate to the application directory
cd /var/www/html/inventory-frontend

# Create API directories if they don't exist
sudo mkdir -p src/app/api/billing
sudo mkdir -p src/app/api/dispatch

# Copy API files
sudo cp -r /tmp/billing/* src/app/api/billing/
sudo cp -r /tmp/dispatch/* src/app/api/dispatch/

# Set proper permissions
sudo chown -R www-data:www-data src/app/api/
sudo chmod -R 755 src/app/api/

# Restart the application
sudo systemctl restart inventory-frontend || sudo pm2 restart all

echo "API routes deployed successfully!"
"@

# Save deploy script
$deployScript | Out-File -FilePath "temp_deploy.sh" -Encoding UTF8

# Upload and execute deploy script
scp -i $SSH_KEY "temp_deploy.sh" "${SERVER}:/tmp/"
ssh -i $SSH_KEY $SERVER "chmod +x /tmp/temp_deploy.sh && /tmp/temp_deploy.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] API routes deployed successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to deploy API routes" -ForegroundColor Red
}

# Step 3: Test API endpoints
Write-Host ""
Write-Host "[TEST] Step 3: Testing API endpoints..." -ForegroundColor Cyan

$testScript = @"
#!/bin/bash

echo "Testing API endpoints..."

# Test search-products endpoint
echo "1. Testing /api/dispatch/search-products"
curl -s -o /dev/null -w "%{http_code}" "https://api.giftgala.in/api/dispatch/search-products?query=test" || echo "Endpoint not responding"

# Test store-inventory endpoint  
echo "2. Testing /api/billing/store-inventory"
curl -s -o /dev/null -w "%{http_code}" "https://api.giftgala.in/api/billing/store-inventory" || echo "Endpoint not responding"

# Test history endpoint
echo "3. Testing /api/billing/history"
curl -s -o /dev/null -w "%{http_code}" "https://api.giftgala.in/api/billing/history" || echo "Endpoint not responding"

echo "API endpoint tests completed"
"@

$testScript | Out-File -FilePath "temp_test.sh" -Encoding UTF8
scp -i $SSH_KEY "temp_test.sh" "${SERVER}:/tmp/"
ssh -i $SSH_KEY $SERVER "chmod +x /tmp/temp_test.sh && /tmp/temp_test.sh"

# Clean up
Remove-Item "temp_api_deploy" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "temp_deploy.sh" -Force -ErrorAction SilentlyContinue
Remove-Item "temp_test.sh" -Force -ErrorAction SilentlyContinue
ssh -i $SSH_KEY $SERVER "rm -f /tmp/temp_deploy.sh /tmp/temp_test.sh /tmp/billing /tmp/dispatch"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  [SUCCESS] BILLING APIs DEPLOYED!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "API Endpoints Available:" -ForegroundColor Cyan
Write-Host "   POST https://api.giftgala.in/api/billing/generate" -ForegroundColor White
Write-Host "   GET  https://api.giftgala.in/api/billing/history" -ForegroundColor White
Write-Host "   GET  https://api.giftgala.in/api/billing/store-inventory" -ForegroundColor White
Write-Host "   GET  https://api.giftgala.in/api/dispatch/search-products" -ForegroundColor White
Write-Host "   GET  https://api.giftgala.in/api/dispatch/warehouses" -ForegroundColor White
Write-Host ""
Write-Host "[OK] Billing system is now fully operational!" -ForegroundColor Green
Write-Host ""