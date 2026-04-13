# Find existing database backup on server and copy it
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Finding Database Backup on Server ===" -ForegroundColor Green

# Create backup directory
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$backupDir = "$desktopPath\database-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "`nSearching for .sql files on server..." -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "find ~ -name '*.sql' -type f -exec ls -lh {} \;"

Write-Host "`nSearching in /tmp folder..." -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "ls -lh /tmp/*.sql 2>/dev/null || echo 'No .sql files in /tmp'"

Write-Host "`nSearching in home directory..." -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "ls -lh ~/*.sql 2>/dev/null || echo 'No .sql files in home'"

Write-Host "`n=== Enter the full path of the database file ===" -ForegroundColor Cyan
Write-Host "Example: /tmp/inventory_backup.sql or ~/backup.sql" -ForegroundColor Gray
$dbPath = Read-Host "Database file path on server"

if ($dbPath) {
    Write-Host "`nCopying database from server..." -ForegroundColor Yellow
    scp -i "$sshKey" "${serverUser}@${serverIP}:$dbPath" "$backupDir\inventory_backup.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDatabase copied successfully!" -ForegroundColor Green
        Write-Host "Location: $backupDir\inventory_backup.sql" -ForegroundColor Cyan
        $dbSize = (Get-Item "$backupDir\inventory_backup.sql").Length / 1MB
        Write-Host "Size: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Cyan
    } else {
        Write-Host "`nFailed to copy database" -ForegroundColor Red
    }
} else {
    Write-Host "No path provided" -ForegroundColor Red
}
