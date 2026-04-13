Write-Host "Downloading inventory_backup_final.sql from Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$SERVER = "ubuntu@54.251.22.246"
$REMOTE_FILE = "~/inventory_backup_final.sql"
$LOCAL_FILE = "inventory_backup_final.sql"

Write-Host "`nChecking file on server..." -ForegroundColor Yellow
ssh $SERVER "ls -lh $REMOTE_FILE"

Write-Host "`nDownloading database backup..." -ForegroundColor Yellow
Write-Host "From: $SERVER`:$REMOTE_FILE" -ForegroundColor White
Write-Host "To: $LOCAL_FILE" -ForegroundColor White
Write-Host ""

scp "${SERVER}:${REMOTE_FILE}" "./$LOCAL_FILE"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Download Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "File Details:" -ForegroundColor Cyan
    $file = Get-Item $LOCAL_FILE
    Write-Host "  Name: $($file.Name)" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($file.Length/1MB,2)) MB" -ForegroundColor White
    Write-Host "  Path: $($file.FullName)" -ForegroundColor White
    Write-Host ""
    Write-Host "To restore this database locally:" -ForegroundColor Yellow
    Write-Host "1. Create database: mysql -u root -p -e 'CREATE DATABASE inventory_db;'" -ForegroundColor Gray
    Write-Host "2. Import backup: mysql -u root -p inventory_db < $LOCAL_FILE" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Download Failed!" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. SSH connection to server" -ForegroundColor White
    Write-Host "2. File exists on server" -ForegroundColor White
    Write-Host "3. Network connectivity" -ForegroundColor White
}
