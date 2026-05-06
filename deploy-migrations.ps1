# PowerShell script to deploy and run migrations on AWS EC2 server

$SERVER = "root@13.212.202.137"
$REMOTE_DIR = "/root/inventory-migrations"

Write-Host "📦 Preparing migration package..." -ForegroundColor Cyan

# Create temporary directory
$TempDir = "$env:TEMP\migrations-package"
if (Test-Path $TempDir) {
    Remove-Item $TempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy files
Copy-Item -Path "migrations" -Destination $TempDir -Recurse
Copy-Item -Path "run-migrations.js" -Destination $TempDir
Copy-Item -Path "package.json" -Destination $TempDir
Copy-Item -Path ".env.production" -Destination "$TempDir\.env.local"

Write-Host "📤 Uploading to server..." -ForegroundColor Cyan
ssh $SERVER "mkdir -p $REMOTE_DIR"
scp -r "$TempDir\*" "${SERVER}:${REMOTE_DIR}/"

Write-Host "🔧 Installing dependencies on server..." -ForegroundColor Cyan
ssh $SERVER "cd $REMOTE_DIR && npm install mysql2 dotenv"

Write-Host "🚀 Running migrations on server..." -ForegroundColor Cyan
ssh $SERVER "cd $REMOTE_DIR && node run-migrations.js"

Write-Host "`n✅ Migration deployment complete!" -ForegroundColor Green
Write-Host "`nTo verify, run:" -ForegroundColor Yellow
Write-Host "ssh $SERVER 'mysql -u inventory_user -pStrongPass@123 inventory_db -e `"SHOW TABLES LIKE \`"%permission%\`"`"'" -ForegroundColor Gray

# Cleanup
Remove-Item $TempDir -Recurse -Force
