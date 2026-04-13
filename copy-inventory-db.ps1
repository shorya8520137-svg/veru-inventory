# Copy inventory_db database from server
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Copying inventory_db Database ===" -ForegroundColor Green

# Create backup directory
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$backupDir = "$desktopPath\inventory-db-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "Created: $backupDir" -ForegroundColor Cyan

# Step 1: Create database dump on server
Write-Host "`nCreating database dump on server..." -ForegroundColor Yellow
$dumpFile = "inventory_db_backup.sql"

# Create dump without password prompt (using sudo mysql)
$dumpCommand = "sudo mysqldump inventory_db > /tmp/$dumpFile"
Write-Host "Running: $dumpCommand" -ForegroundColor Gray

ssh -i "$sshKey" "${serverUser}@${serverIP}" "$dumpCommand"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database dump created successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to create dump" -ForegroundColor Red
    exit
}

# Step 2: Copy database dump to Desktop
Write-Host "`nCopying database to Desktop..." -ForegroundColor Yellow
scp -i "$sshKey" "${serverUser}@${serverIP}:/tmp/$dumpFile" "$backupDir\inventory_db_backup.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS! Database copied!" -ForegroundColor Green
    $dbSize = (Get-Item "$backupDir\inventory_db_backup.sql").Length / 1MB
    Write-Host "Size: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Cyan
    Write-Host "Location: $backupDir\inventory_db_backup.sql" -ForegroundColor Cyan
} else {
    Write-Host "`nFailed to copy database" -ForegroundColor Red
    exit
}

# Step 3: Cleanup server
Write-Host "`nCleaning up server..." -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "rm -f /tmp/$dumpFile"
Write-Host "Done!" -ForegroundColor Green

Write-Host "`n=== Complete ===" -ForegroundColor Green
Write-Host "Database saved to: $backupDir\inventory_db_backup.sql" -ForegroundColor Cyan
