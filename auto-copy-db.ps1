# Automatically find and copy database backup from server
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Auto-Copying Database from Server ===" -ForegroundColor Green

# Create backup directory
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$backupDir = "$desktopPath\database-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "Created: $backupDir" -ForegroundColor Cyan

# Common database backup locations to try
$locations = @(
    "/tmp/inventory_backup.sql",
    "~/inventory_backup.sql",
    "~/backup.sql",
    "/tmp/backup.sql",
    "~/inventoryfullstack/inventory_backup.sql"
)

$found = $false

foreach ($location in $locations) {
    Write-Host "`nTrying: $location" -ForegroundColor Yellow
    
    scp -i "$sshKey" "${serverUser}@${serverIP}:$location" "$backupDir\inventory_backup.sql" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS! Database found and copied!" -ForegroundColor Green
        $dbSize = (Get-Item "$backupDir\inventory_backup.sql").Length / 1MB
        Write-Host "Size: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Cyan
        Write-Host "Location: $backupDir\inventory_backup.sql" -ForegroundColor Cyan
        $found = $true
        break
    }
}

if (-not $found) {
    Write-Host "`nDatabase not found in common locations." -ForegroundColor Red
    Write-Host "Listing all .sql files on server..." -ForegroundColor Yellow
    ssh -i "$sshKey" "${serverUser}@${serverIP}" "find ~ /tmp -name '*.sql' -type f 2>/dev/null | head -20"
    
    Write-Host "`nPlease enter the full path manually:" -ForegroundColor Cyan
    $customPath = Read-Host "Database file path"
    
    if ($customPath) {
        scp -i "$sshKey" "${serverUser}@${serverIP}:$customPath" "$backupDir\inventory_backup.sql"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`nDatabase copied successfully!" -ForegroundColor Green
            $dbSize = (Get-Item "$backupDir\inventory_backup.sql").Length / 1MB
            Write-Host "Size: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Cyan
        }
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Green
