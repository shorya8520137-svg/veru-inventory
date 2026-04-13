# Copy project and database WITHOUT node_modules
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Copying from Server (Excluding node_modules) ===" -ForegroundColor Green

# Create backup directory
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$backupDir = "$desktopPath\server-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "Created: $backupDir" -ForegroundColor Cyan

# Step 1: Create tar archive on server (excluding node_modules and .next)
Write-Host "`n=== Step 1: Creating archive on server (excluding node_modules) ===" -ForegroundColor Yellow
$archiveName = "inventoryfullstack-backup.tar.gz"
ssh -i "$sshKey" "${serverUser}@${serverIP}" "cd ~ && tar -czf /tmp/$archiveName --exclude='node_modules' --exclude='.next' --exclude='.git' inventoryfullstack"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Archive created on server" -ForegroundColor Green
} else {
    Write-Host "Failed to create archive" -ForegroundColor Red
    exit
}

# Step 2: Copy archive to Desktop
Write-Host "`n=== Step 2: Copying archive to Desktop ===" -ForegroundColor Yellow
scp -i "$sshKey" "${serverUser}@${serverIP}:/tmp/$archiveName" "$backupDir\$archiveName"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Archive copied successfully!" -ForegroundColor Green
    $size = (Get-Item "$backupDir\$archiveName").Length / 1MB
    Write-Host "Size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "Failed to copy archive" -ForegroundColor Red
    exit
}

# Step 3: Extract archive
Write-Host "`n=== Step 3: Extracting archive ===" -ForegroundColor Yellow
tar -xzf "$backupDir\$archiveName" -C "$backupDir"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Project extracted successfully!" -ForegroundColor Green
    Remove-Item "$backupDir\$archiveName" -Force
    Write-Host "Cleaned up archive file" -ForegroundColor Gray
} else {
    Write-Host "Failed to extract. Archive saved at: $backupDir\$archiveName" -ForegroundColor Yellow
}

# Step 4: Copy database
Write-Host "`n=== Step 4: Copying Database ===" -ForegroundColor Yellow
Write-Host "Creating database dump on server..." -ForegroundColor Cyan

$dbDumpName = "inventory_backup.sql"
ssh -i "$sshKey" "${serverUser}@${serverIP}" "mysqldump -u root -p inventory > /tmp/$dbDumpName 2>&1"

Write-Host "Copying database dump..." -ForegroundColor Cyan
scp -i "$sshKey" "${serverUser}@${serverIP}:/tmp/$dbDumpName" "$backupDir\$dbDumpName"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database copied successfully!" -ForegroundColor Green
    $dbSize = (Get-Item "$backupDir\$dbDumpName").Length / 1MB
    Write-Host "Database size: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "Database copy failed (may need password)" -ForegroundColor Yellow
}

# Cleanup server
Write-Host "`n=== Cleaning up server ===" -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "rm -f /tmp/$archiveName /tmp/$dbDumpName"
Write-Host "Server cleanup done" -ForegroundColor Green

# Summary
Write-Host "`n=== COMPLETE ===" -ForegroundColor Green
Write-Host "Location: $backupDir" -ForegroundColor Cyan
Write-Host "`nContents:" -ForegroundColor Yellow
Write-Host "  - inventoryfullstack/ (WITHOUT node_modules)" -ForegroundColor White
Write-Host "  - inventory_backup.sql (database)" -ForegroundColor White
Write-Host "`nRun 'npm install' in the project folder to install dependencies" -ForegroundColor Gray
