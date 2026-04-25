# PowerShell script to download database from server

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"
$outputFile = "inventory_db_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

Write-Host "📥 Downloading database from server..." -ForegroundColor Cyan
Write-Host ""

# Create mysqldump command
$dumpCommand = "sudo mysqldump -u root inventory_db > /tmp/inventory_backup.sql && cat /tmp/inventory_backup.sql"

Write-Host "Executing mysqldump on server..." -ForegroundColor Yellow

# Execute via SSH and save to local file
ssh -i $sshKey $sshHost $dumpCommand | Out-File -FilePath $outputFile -Encoding UTF8

if (Test-Path $outputFile) {
    $fileSize = (Get-Item $outputFile).Length / 1MB
    Write-Host ""
    Write-Host "✅ Database downloaded successfully!" -ForegroundColor Green
    Write-Host "📁 File: $outputFile" -ForegroundColor White
    Write-Host "📊 Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    Write-Host "🧹 Cleaning up server temp file..." -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo rm /tmp/inventory_backup.sql"
    Write-Host "✅ Done!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to download database!" -ForegroundColor Red
}
