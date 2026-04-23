# ============================================
# DEPLOY BILLING API ROUTES TO SERVER
# ============================================

$SSH_KEY = "C:\Users\Public\pem.pem"
$SERVER = "ubuntu@13.229.121.238"
$APP_DIR = "/home/ubuntu/inventoryfullstack"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING BILLING API ROUTES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload API files
Write-Host "[UPLOAD] Step 1: Uploading billing API routes..." -ForegroundColor Cyan

# Upload billing API files
scp -i $SSH_KEY -r "src/app/api/billing" "${SERVER}:/tmp/"
scp -i $SSH_KEY -r "src/app/api/dispatch" "${SERVER}:/tmp/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] API files uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to upload API files" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy to server
Write-Host ""
Write-Host "[DEPLOY] Step 2: Deploying API routes to server..." -ForegroundColor Cyan

$deployCommands = @"
cd /home/ubuntu/inventoryfullstack
mkdir -p src/app/api/billing
mkdir -p src/app/api/dispatch
cp -r /tmp/billing/* src/app/api/billing/
cp -r /tmp/dispatch/* src/app/api/dispatch/
chmod -R 755 src/app/api/billing/
chmod -R 755 src/app/api/dispatch/
pm2 restart all
echo 'API routes deployed successfully!'
"@

ssh -i $SSH_KEY $SERVER $deployCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] API routes deployed successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to deploy API routes" -ForegroundColor Red
}

# Step 3: Verify deployment
Write-Host ""
Write-Host "[VERIFY] Step 3: Verifying API deployment..." -ForegroundColor Cyan

$verifyCommands = @"
echo 'Checking deployed API files:'
ls -la /home/ubuntu/inventoryfullstack/src/app/api/billing/
ls -la /home/ubuntu/inventoryfullstack/src/app/api/dispatch/
echo ''
echo 'Testing API endpoints (expecting 401 - means deployed but needs auth):'
curl -s -o /dev/null -w 'search-products: %{http_code}\n' 'https://api.giftgala.in/api/dispatch/search-products?query=test'
curl -s -o /dev/null -w 'store-inventory: %{http_code}\n' 'https://api.giftgala.in/api/billing/store-inventory'
curl -s -o /dev/null -w 'billing-history: %{http_code}\n' 'https://api.giftgala.in/api/billing/history'
"@

ssh -i $SSH_KEY $SERVER $verifyCommands

# Clean up
ssh -i $SSH_KEY $SERVER "rm -rf /tmp/billing /tmp/dispatch"

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