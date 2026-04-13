# Deploy product name fix to server
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.51.226"

Write-Host "=== Deploying Product Name Fix ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Pulling latest code from GitHub..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER @"
cd ~/inventoryfullstack
git fetch origin
git reset --hard origin/stocksphere-clean
"@

Write-Host ""
Write-Host "Step 2: Restarting backend server..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "pm2 restart all"

Write-Host ""
Write-Host "Step 3: Checking PM2 status..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "pm2 status"

Write-Host ""
Write-Host "Step 4: Checking recent logs..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "pm2 logs --lines 20 --nostream"

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "The website orders page should now show product names!" -ForegroundColor Cyan
Write-Host "Test it at: https://13.212.51.226:8443" -ForegroundColor Cyan
Write-Host ""
