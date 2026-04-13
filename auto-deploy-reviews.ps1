# Automated deployment script for review system fix
# This script will SSH to the server and execute all necessary commands

$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.51.226"

Write-Host "🚀 Starting automated deployment..." -ForegroundColor Green
Write-Host ""

# Step 1: Commit and push local changes
Write-Host "📦 Step 1: Pushing local changes to GitHub..." -ForegroundColor Cyan
git add controllers/reviewController.js create_product_reviews_fixed.sql
git commit -m "Fix review controller to use correct product_id column"
git push origin stocksphere-clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes pushed to GitHub" -ForegroundColor Green
Write-Host ""

# Step 2: Create the deployment commands
$DEPLOY_COMMANDS = @"
cd ~/inventoryfullstack && \
echo '📥 Pulling latest code...' && \
git pull origin stocksphere-clean && \
echo '🗄️  Creating database tables...' && \
sudo mysql inventory_db < create_product_reviews_fixed.sql && \
echo '✅ Database tables created!' && \
echo '🔄 Restarting backend server...' && \
pm2 restart backend && \
echo '✅ Backend restarted!' && \
echo '' && \
echo '📊 Checking server status...' && \
pm2 status && \
echo '' && \
echo '🎉 Deployment complete!'
"@

# Step 3: Execute commands on server via SSH
Write-Host "🔧 Step 2: Executing deployment on server..." -ForegroundColor Cyan
Write-Host ""

ssh -i $SSH_KEY $SERVER $DEPLOY_COMMANDS

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Test the reviews page at: https://13.212.51.226:8443/reviews" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the errors above." -ForegroundColor Red
    exit 1
}
