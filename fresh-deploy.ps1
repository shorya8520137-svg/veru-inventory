# Fresh Deployment - Remove old project and clone from GitHub
# This will give you a clean deployment from your GitHub repository

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  FRESH DEPLOYMENT FROM GITHUB" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Server details
$SERVER_IP = "13.62.99.152"
$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SSH_USER = "ubuntu"
$GITHUB_REPO = "https://github.com/shorya8520137-svg/veru-inventory.git"
$PROJECT_DIR = "veru-inventory"

Write-Host "[INFO] Server: $SSH_USER@$SERVER_IP" -ForegroundColor Green
Write-Host "[INFO] GitHub Repo: $GITHUB_REPO" -ForegroundColor Green
Write-Host "[INFO] Project Directory: ~/$PROJECT_DIR" -ForegroundColor Green
Write-Host ""

# Step 1: Stop any running processes
Write-Host "[STEP 1] Stopping running processes..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "pm2 delete all 2>/dev/null || true; pkill -f 'node server.js' 2>/dev/null || true"
Write-Host "[OK] Processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Remove old project directories
Write-Host "[STEP 2] Removing old project directories..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "rm -rf ~/inventory-app ~/veru-inventory ~/veru-inventory-main 2>/dev/null || true"
Write-Host "[OK] Old directories removed" -ForegroundColor Green
Write-Host ""

# Step 3: Clone fresh from GitHub
Write-Host "[STEP 3] Cloning fresh from GitHub..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "cd ~ && git clone $GITHUB_REPO"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to clone repository!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Repository cloned successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Install dependencies
Write-Host "[STEP 4] Installing dependencies..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "cd ~/$PROJECT_DIR && npm install"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 5: Copy environment file
Write-Host "[STEP 5] Setting up environment..." -ForegroundColor Yellow
Write-Host "[INFO] Uploading .env file..." -ForegroundColor White

if (Test-Path ".env.production") {
    scp -i $SSH_KEY .env.production "${SSH_USER}@${SERVER_IP}:~/$PROJECT_DIR/.env"
    Write-Host "[OK] Environment file uploaded" -ForegroundColor Green
} else {
    Write-Host "[WARNING] .env.production not found locally" -ForegroundColor Yellow
    Write-Host "[INFO] You'll need to create .env file on server manually" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Start the application
Write-Host "[STEP 6] Starting application with PM2..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "cd ~/$PROJECT_DIR && pm2 start server.js --name veru-inventory && pm2 save"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start application!" -ForegroundColor Red
    Write-Host "[INFO] Try starting manually:" -ForegroundColor Yellow
    Write-Host "  ssh -i `"$SSH_KEY`" $SSH_USER@$SERVER_IP" -ForegroundColor White
    Write-Host "  cd ~/$PROJECT_DIR" -ForegroundColor White
    Write-Host "  node server.js" -ForegroundColor White
    exit 1
}

Write-Host "[OK] Application started" -ForegroundColor Green
Write-Host ""

# Step 7: Show status
Write-Host "[STEP 7] Checking status..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "pm2 list && pm2 logs veru-inventory --lines 10 --nostream"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is now running on the server!" -ForegroundColor Green
Write-Host ""
Write-Host "What was deployed:" -ForegroundColor Cyan
Write-Host "  - Fresh clone from GitHub" -ForegroundColor White
Write-Host "  - All latest code including permissions system" -ForegroundColor White
Write-Host "  - RoleModalNew.jsx with tab-based UI" -ForegroundColor White
Write-Host "  - Dynamic warehouse dropdown" -ForegroundColor White
Write-Host "  - All 155 permissions" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify .env file has correct database credentials" -ForegroundColor White
Write-Host "  2. Test the application at your frontend URL" -ForegroundColor White
Write-Host "  3. Login as: admin@company.com / Admin@123" -ForegroundColor White
Write-Host "  4. Go to Permissions page and test the new UI" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs: ssh -i `"$SSH_KEY`" $SSH_USER@$SERVER_IP 'pm2 logs veru-inventory'" -ForegroundColor White
Write-Host "  Restart: ssh -i `"$SSH_KEY`" $SSH_USER@$SERVER_IP 'pm2 restart veru-inventory'" -ForegroundColor White
Write-Host "  Stop: ssh -i `"$SSH_KEY`" $SSH_USER@$SERVER_IP 'pm2 stop veru-inventory'" -ForegroundColor White
Write-Host ""
