# Simple database download script

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "Downloading database..." -ForegroundColor Cyan

$outputFile = "inventory_backup.sql"

# Create dump on server
Write-Host "Creating dump on server..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost 'sudo mysqldump -u root inventory_db > /tmp/inventory_backup.sql'

# Download the file
Write-Host "Downloading file..." -ForegroundColor Yellow
scp -i $sshKey "${sshHost}:/tmp/inventory_backup.sql" $outputFile

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost 'sudo rm /tmp/inventory_backup.sql'

if (Test-Path $outputFile) {
    $fileSize = (Get-Item $outputFile).Length / 1MB
    $fileSizeMB = [math]::Round($fileSize, 2)
    Write-Host ""
    Write-Host "SUCCESS! Database downloaded: $outputFile" -ForegroundColor Green
    Write-Host "File size: $fileSizeMB MB" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "FAILED to download database!" -ForegroundColor Red
}
