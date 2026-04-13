# Download database from server
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.51.226"

Write-Host "=== Downloading Database ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Creating database dump on server..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "sudo mysqldump inventory_db > /tmp/inventory_db_backup.sql"

Write-Host ""
Write-Host "Step 2: Downloading to local machine..." -ForegroundColor Yellow
scp -i $SSH_KEY "${SERVER}:/tmp/inventory_db_backup.sql" "./inventory_db_backup.sql"

Write-Host ""
Write-Host "Step 3: Cleaning up server..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "rm /tmp/inventory_db_backup.sql"

Write-Host ""
Write-Host "=== Download Complete ===" -ForegroundColor Green
Write-Host "Database saved to: inventory_db_backup.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "To analyze locally, install MySQL and run:" -ForegroundColor Yellow
Write-Host "mysql -u root -p -e 'CREATE DATABASE inventory_db_local;'" -ForegroundColor White
Write-Host "mysql -u root -p inventory_db_local < inventory_db_backup.sql" -ForegroundColor White
Write-Host ""
