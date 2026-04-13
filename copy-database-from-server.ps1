# Copy database from server to local Desktop
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Copying Database from Server ===" -ForegroundColor Green

# Create backup directory on Desktop
$backupDir = "$desktopPath\server-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Cyan

# First, create a database dump on the server
Write-Host "`nCreating database dump on server..." -ForegroundColor Yellow
$dumpCommand = "mysqldump -u root -p inventory > /tmp/inventory_backup.sql"
Write-Host "Run this command on the server to create the dump:" -ForegroundColor Cyan
Write-Host $dumpCommand -ForegroundColor White

# Copy the database dump from server
Write-Host "`nCopying database dump from server..." -ForegroundColor Yellow
$scpCommand = "scp -i `"$sshKey`" ${serverUser}@${serverIP}:/tmp/inventory_backup.sql `"$backupDir\inventory_backup.sql`""
Write-Host "Executing: $scpCommand" -ForegroundColor Cyan
Invoke-Expression $scpCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Database dump copied successfully!" -ForegroundColor Green
    Write-Host "Location: $backupDir\inventory_backup.sql" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Failed to copy database dump" -ForegroundColor Red
}

Write-Host "`n=== Complete ===" -ForegroundColor Green
Write-Host "Database backup saved to: $backupDir" -ForegroundColor Cyan
