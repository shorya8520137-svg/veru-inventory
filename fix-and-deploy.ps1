# Complete fix and deployment script
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@18.143.133.96"

Write-Host "=== Fixing and Deploying Backend ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Killing process on port 5000..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "sudo lsof -ti:5000 | xargs sudo kill -9 2>/dev/null || true"

Write-Host ""
Write-Host "Step 2: Stopping PM2 processes..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "pm2 stop all"
ssh -i $SSH_KEY $SERVER "pm2 delete all"

Write-Host ""
Write-Host "Step 3: Pulling latest code..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER @"
cd ~/inventoryfullstack
git fetch origin
git reset --hard origin/stocksphere-clean
"@

Write-Host ""
Write-Host "Step 4: Starting backend..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER @"
cd ~/inventoryfullstack
pm2 start server.js --name backend
"@

Write-Host ""
Write-Host "Step 5: Checking status..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "pm2 status"

Write-Host ""
Write-Host "Step 6: Checking logs..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "pm2 logs --lines 30 --nostream"

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Backend is running. Test the orders page now!" -ForegroundColor Cyan
Write-Host ""
