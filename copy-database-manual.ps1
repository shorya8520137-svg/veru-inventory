# Manual database copy - Run these commands step by step
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Database Copy Instructions ===" -ForegroundColor Green
Write-Host "`nStep 1: Connect to server and create database dump" -ForegroundColor Yellow
Write-Host "Run this command:" -ForegroundColor Cyan
Write-Host "ssh -i `"$sshKey`" ${serverUser}@${serverIP}" -ForegroundColor White
Write-Host "`nThen on the server, run:" -ForegroundColor Cyan
Write-Host "mysqldump -u root -p inventory > /tmp/inventory_backup.sql" -ForegroundColor White
Write-Host "(Enter MySQL password when prompted)" -ForegroundColor Gray

Write-Host "`nStep 2: Exit the server (type 'exit')" -ForegroundColor Yellow

Write-Host "`nStep 3: Copy the database dump to your Desktop" -ForegroundColor Yellow
Write-Host "Run this command:" -ForegroundColor Cyan
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$backupDir = "$desktopPath\database-backup-$timestamp"
Write-Host "New-Item -ItemType Directory -Path `"$backupDir`" -Force" -ForegroundColor White
Write-Host "scp -i `"$sshKey`" ${serverUser}@${serverIP}:/tmp/inventory_backup.sql `"$backupDir\inventory_backup.sql`"" -ForegroundColor White

Write-Host "`nStep 4: Clean up server temp file" -ForegroundColor Yellow
Write-Host "ssh -i `"$sshKey`" ${serverUser}@${serverIP} `"rm /tmp/inventory_backup.sql`"" -ForegroundColor White

Write-Host "`n=== Or run automatic copy (if you want to try again) ===" -ForegroundColor Green
Write-Host "Press any key to attempt automatic copy..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nAttempting automatic copy..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "$backupDir" -Force | Out-Null

# Try to copy existing dump if it exists
scp -i "$sshKey" "${serverUser}@${serverIP}:/tmp/inventory_backup.sql" "$backupDir\inventory_backup.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDatabase copied successfully!" -ForegroundColor Green
    Write-Host "Location: $backupDir\inventory_backup.sql" -ForegroundColor Cyan
    $dbSize = (Get-Item "$backupDir\inventory_backup.sql").Length / 1MB
    Write-Host "Size: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "`nNo existing dump found. Please follow manual steps above." -ForegroundColor Yellow
}
