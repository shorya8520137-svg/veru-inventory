Write-Host "Downloading Latest Database from Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$SERVER = "ubuntu@54.251.22.246"
$DB_NAME = "inventory_db"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "inventory_db_latest_$DATE.sql"

Write-Host "`nStep 1: Creating database dump on server..." -ForegroundColor Yellow
ssh $SERVER "sudo mysqldump $DB_NAME > /tmp/$BACKUP_FILE"

Write-Host "`nStep 2: Downloading to local machine..." -ForegroundColor Yellow
scp "${SERVER}:/tmp/$BACKUP_FILE" "./$BACKUP_FILE"

Write-Host "`nStep 3: Cleaning up server..." -ForegroundColor Yellow
ssh $SERVER "rm /tmp/$BACKUP_FILE"

Write-Host "`n✅ Download Complete!" -ForegroundColor Green
Write-Host "Database saved to: $BACKUP_FILE" -ForegroundColor Cyan
Write-Host "`nFile size:" -ForegroundColor Yellow
Get-Item $BACKUP_FILE | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}
