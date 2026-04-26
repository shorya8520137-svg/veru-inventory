# Fix payment_mode ENUM to include 'internal_transfer'
# Run this script to update the production database

$SERVER = "root@139.59.77.136"
$DB_NAME = "giftgala_inventory"
$SQL_FILE = "migrations/add_internal_transfer_payment_mode.sql"

Write-Host "🔧 Fixing payment_mode ENUM in bills table..." -ForegroundColor Cyan
Write-Host ""

# Upload SQL file
Write-Host "📤 Uploading migration file..." -ForegroundColor Yellow
scp $SQL_FILE "${SERVER}:/tmp/add_internal_transfer_payment_mode.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload SQL file" -ForegroundColor Red
    exit 1
}

Write-Host "✅ SQL file uploaded" -ForegroundColor Green
Write-Host ""

# Execute SQL
Write-Host "🔄 Executing migration..." -ForegroundColor Yellow
ssh $SERVER "mysql -u root -p$DB_NAME < /tmp/add_internal_transfer_payment_mode.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
Write-Host ""

# Verify
Write-Host "🔍 Verifying payment_mode column..." -ForegroundColor Yellow
ssh $SERVER "mysql -u root -p$DB_NAME -e `"SHOW COLUMNS FROM bills LIKE 'payment_mode';`""

Write-Host ""
Write-Host "✅ Done! Store-to-store transfers should now work correctly." -ForegroundColor Green
