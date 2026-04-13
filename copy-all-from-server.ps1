# Copy both database and project from server to Desktop
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Copying Database and Project from Server ===" -ForegroundColor Green
Write-Host "Server: $serverUser@$serverIP" -ForegroundColor Cyan
Write-Host "Destination: $desktopPath" -ForegroundColor Cyan

# Create backup directory
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$backupDir = "$desktopPath\server-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "`nCreated backup directory: $backupDir" -ForegroundColor Cyan

# Step 1: Create database dump on server
Write-Host "`n=== Step 1: Creating Database Dump on Server ===" -ForegroundColor Yellow
Write-Host "Connecting to server and creating database dump..." -ForegroundColor Cyan

$dumpFile = "inventory_backup_$timestamp.sql"
ssh -i "$sshKey" "${serverUser}@${serverIP}" "mysqldump -u root -p inventory > /tmp/$dumpFile 2>&1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database dump created on server" -ForegroundColor Green
} else {
    Write-Host "Note: You may need to enter MySQL password on the server" -ForegroundColor Yellow
}

# Step 2: Copy database dump
Write-Host "`n=== Step 2: Copying Database Dump ===" -ForegroundColor Yellow
scp -i "$sshKey" "${serverUser}@${serverIP}:/tmp/$dumpFile" "$backupDir\inventory_backup.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database dump copied successfully!" -ForegroundColor Green
    $dbSize = (Get-Item "$backupDir\inventory_backup.sql").Length / 1MB
    Write-Host "Database size: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "Failed to copy database dump" -ForegroundColor Red
}

# Step 3: Copy project directory
Write-Host "`n=== Step 3: Copying inventoryfullstack Project ===" -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Cyan

$projectDestination = "$backupDir\inventoryfullstack"
scp -i "$sshKey" -r "${serverUser}@${serverIP}:~/inventoryfullstack" "$projectDestination"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Project copied successfully!" -ForegroundColor Green
    $projectSize = (Get-ChildItem -Path $projectDestination -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Project size: $([math]::Round($projectSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "Failed to copy project" -ForegroundColor Red
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Green
Write-Host "All files saved to: $backupDir" -ForegroundColor Cyan
Write-Host "`nContents:" -ForegroundColor Yellow
Write-Host "  - inventory_backup.sql (database dump)" -ForegroundColor White
Write-Host "  - inventoryfullstack/ (project directory)" -ForegroundColor White

# Cleanup server temp file
Write-Host "`n=== Cleaning up server temp files ===" -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "rm -f /tmp/$dumpFile"
Write-Host "Cleanup complete" -ForegroundColor Green

Write-Host "`n=== All Done! ===" -ForegroundColor Green
