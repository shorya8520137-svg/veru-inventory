# Deploy Migrations to Insora Server
# Quick deployment script for permissions redesign migrations

$SERVER_IP = "13.51.162.72"
$KEY_PATH = "C:\insora.pem"
$SERVER_USER = "ubuntu"
$REMOTE_DIR = "/home/ubuntu/inventory-migrations"

Write-Host "📦 Deploying migrations to Insora server..." -ForegroundColor Cyan
Write-Host ""

# Test connection
Write-Host "🔌 Testing connection..." -ForegroundColor Yellow
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo 'Connected!'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Connection failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Connected!" -ForegroundColor Green
Write-Host ""

# Create directory
Write-Host "📁 Creating remote directory..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} "mkdir -p $REMOTE_DIR"

# Upload files
Write-Host "📤 Uploading migration files..." -ForegroundColor Yellow
scp -i $KEY_PATH -r migrations ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH run-migrations.js ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH package.json ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/

# Upload .env file
Write-Host "⚙️ Uploading environment config..." -ForegroundColor Yellow
scp -i $KEY_PATH .env.insora ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/.env.local

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} "cd $REMOTE_DIR; npm install mysql2 dotenv"

# Run migrations
Write-Host ""
Write-Host "🚀 Running migrations..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} "cd $REMOTE_DIR; node run-migrations.js"
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Verify
Write-Host "Verifying setup..." -ForegroundColor Cyan
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} "mysql -u inventory_user -pStrongPass@123 inventory_db -e 'SELECT COUNT(*) as new_tables FROM information_schema.tables WHERE table_schema=\"inventory_db\" AND table_name LIKE \"%permission%\";'"

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To verify manually:" -ForegroundColor Yellow
Write-Host "  ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Gray
