# Copy inventoryfullstack project WITHOUT node_modules
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Copying Project (Excluding node_modules) ===" -ForegroundColor Green

# Create backup directory
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$backupDir = "$desktopPath\inventoryfullstack-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "Created: $backupDir" -ForegroundColor Cyan

# Step 1: Create tar archive on server (excluding node_modules, .next, .git)
Write-Host "`nCreating archive on server (excluding node_modules)..." -ForegroundColor Yellow
$archiveName = "inventoryfullstack.tar.gz"

ssh -i "$sshKey" "${serverUser}@${serverIP}" "cd ~ && tar -czf /tmp/$archiveName --exclude='node_modules' --exclude='.next' --exclude='.git' inventoryfullstack"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Archive created!" -ForegroundColor Green
} else {
    Write-Host "Failed to create archive" -ForegroundColor Red
    exit
}

# Step 2: Copy archive to Desktop
Write-Host "`nCopying archive to Desktop..." -ForegroundColor Yellow
scp -i "$sshKey" "${serverUser}@${serverIP}:/tmp/$archiveName" "$backupDir\$archiveName"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Archive copied!" -ForegroundColor Green
    $size = (Get-Item "$backupDir\$archiveName").Length / 1MB
    Write-Host "Size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "Failed to copy archive" -ForegroundColor Red
    exit
}

# Step 3: Extract archive
Write-Host "`nExtracting project..." -ForegroundColor Yellow
tar -xzf "$backupDir\$archiveName" -C "$backupDir"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Project extracted successfully!" -ForegroundColor Green
    Remove-Item "$backupDir\$archiveName" -Force
    Write-Host "Cleaned up archive file" -ForegroundColor Gray
} else {
    Write-Host "Extraction failed. Archive saved at: $backupDir\$archiveName" -ForegroundColor Yellow
}

# Step 4: Cleanup server
Write-Host "`nCleaning up server..." -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "rm -f /tmp/$archiveName"
Write-Host "Done!" -ForegroundColor Green

Write-Host "`n=== Complete ===" -ForegroundColor Green
Write-Host "Project saved to: $backupDir\inventoryfullstack" -ForegroundColor Cyan
Write-Host "`nRun 'npm install' in the project folder to install dependencies" -ForegroundColor Yellow
