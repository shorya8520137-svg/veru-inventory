# Deployment Script for Ubuntu Server
# This script pulls latest changes from GitHub and restarts the application

$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.52.15"
$PROJECT_PATH = "~/inventoryfullstack"

Write-Host "🚀 Starting deployment to server..." -ForegroundColor Cyan

# SSH command to execute on server
$COMMANDS = @"
cd $PROJECT_PATH && \
echo '📂 Current directory:' && pwd && \
echo '' && \
echo '🔍 Checking git status...' && \
git status && \
echo '' && \
echo '📥 Fetching latest changes from GitHub...' && \
git fetch origin main && \
echo '' && \
echo '🔄 Pulling changes (with merge strategy)...' && \
git config pull.rebase false && \
git pull origin main && \
echo '' && \
echo '📦 Installing dependencies...' && \
npm install && \
echo '' && \
echo '🏗️ Building application...' && \
npm run build && \
echo '' && \
echo '🔄 Restarting PM2 application...' && \
pm2 restart all && \
echo '' && \
echo '✅ Deployment completed successfully!' && \
pm2 status
"@

Write-Host "📡 Connecting to server: $SERVER" -ForegroundColor Yellow

# Execute commands on server
ssh -i $SSH_KEY $SERVER $COMMANDS

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your application should be updated at: https://54.254.184.54" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Deployment failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
}
