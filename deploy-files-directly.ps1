# Deploy Updated Permissions Files Directly to Server
# This copies only the changed files to the server

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY PERMISSIONS FILES TO SERVER" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Server details
$SERVER_IP = "13.62.99.152"
$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SSH_USER = "ubuntu"
$REMOTE_DIR = "~/inventory-app"

# Check if SSH key exists
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "[ERROR] SSH key not found at $SSH_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Server: $SSH_USER@$SERVER_IP" -ForegroundColor Green
Write-Host "[INFO] Remote directory: $REMOTE_DIR" -ForegroundColor Green
Write-Host ""

# Files to upload
$files = @(
    "src/app/permissions/RoleModalNew.jsx",
    "src/app/permissions/page.jsx",
    "src/app/permissions/permissions.module.css",
    "src/utils/api.js"
)

Write-Host "[STEP 1] Uploading updated files..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    if (Test-Path $file) {
        $remoteFile = "$REMOTE_DIR/$file"
        $remoteDir = Split-Path $remoteFile -Parent
        
        Write-Host "  Uploading: $file" -ForegroundColor White
        
        # Create remote directory if it doesn't exist
        ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "mkdir -p $remoteDir"
        
        # Upload file
        scp -i $SSH_KEY $file "${SSH_USER}@${SERVER_IP}:$remoteFile"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [ERROR] Failed to upload $file" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "  [OK] $file uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[STEP 2] Restarting backend..." -ForegroundColor Yellow

# Check if PM2 is running anything
$pm2Status = ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "pm2 list 2>/dev/null | grep -c 'online' || echo '0'"

if ($pm2Status -match "^\d+$" -and [int]$pm2Status -gt 0) {
    Write-Host "  Found PM2 processes, restarting..." -ForegroundColor White
    ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "cd $REMOTE_DIR && pm2 restart all"
} else {
    Write-Host "  No PM2 processes found. Checking for Node.js processes..." -ForegroundColor White
    
    # Try to find and restart node process
    ssh -i $SSH_KEY "${SSH_USER}@${SERVER_IP}" "cd $REMOTE_DIR && pkill -f 'node server.js' 2>/dev/null; nohup node server.js > server.log 2>&1 &"
    
    Write-Host "  [INFO] Started Node.js process" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Files deployed:" -ForegroundColor Cyan
foreach ($file in $files) {
    Write-Host "  - $file" -ForegroundColor White
}
Write-Host ""
Write-Host "Test it now:" -ForegroundColor Cyan
Write-Host "  1. Open your frontend URL" -ForegroundColor White
Write-Host "  2. Login as: admin@company.com / Admin@123" -ForegroundColor White
Write-Host "  3. Go to Permissions page" -ForegroundColor White
Write-Host "  4. Click Create Role or Edit Role" -ForegroundColor White
Write-Host "  5. See the new tab-based UI with warehouse dropdown!" -ForegroundColor White
Write-Host ""
