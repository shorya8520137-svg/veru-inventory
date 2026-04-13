# Copy only the inventoryfullstack project from server
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Copying inventoryfullstack Project ===" -ForegroundColor Green

# Create timestamped backup directory
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$backupDir = "$desktopPath\server-backup-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "Created: $backupDir" -ForegroundColor Cyan

# Copy project
Write-Host "`nCopying project (this may take a few minutes)..." -ForegroundColor Yellow
scp -i "$sshKey" -r "${serverUser}@${serverIP}:~/inventoryfullstack" "$backupDir\"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nProject copied successfully!" -ForegroundColor Green
    Write-Host "Location: $backupDir\inventoryfullstack" -ForegroundColor Cyan
    
    $projectSize = (Get-ChildItem -Path "$backupDir\inventoryfullstack" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Size: $([math]::Round($projectSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "`nFailed to copy project" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Green
