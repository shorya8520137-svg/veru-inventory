# Force Deployment Script - Discards local changes and uses GitHub version
# Use this if you want to completely replace server code with GitHub version

$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.52.15"
$PROJECT_PATH = "~/inventoryfullstack"

Write-Host "⚠️  WARNING: This will discard all local changes on the server!" -ForegroundColor Red
Write-Host "Press Ctrl+C to cancel, or any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`n🚀 Starting force deployment to server..." -ForegroundColor Cyan

# SSH command to execute on server
$COMMANDS = @"
cd $PROJECT_PATH && \
echo '📂 Current directory:' && pwd && \
echo '' && \
echo '🔍 Checking current status...' && \
git status && \
echo '' && \
echo '📥 Fetching latest changes from GitHub...' && \
git fetch origin main && \
echo '' && \
echo '⚠️  Resetting to remote main branch (discarding local changes)...' && \
git reset --hard origin/main && \
echo '' && \
echo '🧹 Cleaning untracked files...' && \
git clean -fd && \
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
echo '✅ Force deployment completed!' && \
pm2 status
"@

Write-Host "📡 Connecting to server: $SERVER" -ForegroundColor Yellow

# Execute commands on server
ssh -i $SSH_KEY $SERVER $COMMANDS

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Force deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your application should be updated at: https://54.254.184.54" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Deployment failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
}
