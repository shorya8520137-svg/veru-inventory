# Deploy Permissions System to Server
# This script uploads the deployment script and executes it on the server

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY PERMISSIONS TO SERVER" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Server details
$SERVER_IP = "13.62.99.152"
$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SSH_USER = "ubuntu"

# Check if SSH key exists
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "[ERROR] SSH key not found at $SSH_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Using SSH key: $SSH_KEY" -ForegroundColor Green
Write-Host "[INFO] Server: $SSH_USER@$SERVER_IP" -ForegroundColor Green
Write-Host ""

# Upload the deployment script
Write-Host "[STEP 1] Uploading deployment script to server..." -ForegroundColor Yellow
scp -i $SSH_KEY pull-and-deploy.sh "${SSH_USER}@${SERVER_IP}:~/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to upload script!" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Script uploaded successfully!" -ForegroundColor Green
Write-Host ""

# Make script executable and run it
Write-Host "[STEP 2] Executing deployment script on server..." -ForegroundColor Yellow
Write-Host ""

ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "chmod +x ~/pull-and-deploy.sh && ~/pull-and-deploy.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[WARNING] Deployment script encountered issues." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can manually run these commands on the server:" -ForegroundColor Cyan
    Write-Host "  ssh -i `"$SSH_KEY`" $SSH_USER@$SERVER_IP" -ForegroundColor White
    Write-Host "  cd /path/to/your/project" -ForegroundColor White
    Write-Host "  git pull origin main" -ForegroundColor White
    Write-Host "  pm2 restart all" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your permissions system is now live on the server!" -ForegroundColor Green
Write-Host ""
Write-Host "What was deployed:" -ForegroundColor Cyan
Write-Host "  - RoleModalNew.jsx (Tab-based UI)" -ForegroundColor White
Write-Host "  - Updated page.jsx" -ForegroundColor White
Write-Host "  - Updated permissions.module.css" -ForegroundColor White
Write-Host "  - Updated api.js" -ForegroundColor White
Write-Host ""
Write-Host "Test it now:" -ForegroundColor Cyan
Write-Host "  1. Open your frontend URL in browser" -ForegroundColor White
Write-Host "  2. Login as: admin@company.com / Admin@123" -ForegroundColor White
Write-Host "  3. Go to Permissions page" -ForegroundColor White
Write-Host "  4. Click Create Role or Edit Role" -ForegroundColor White
Write-Host "  5. You should see the new tab-based UI!" -ForegroundColor White
Write-Host ""
