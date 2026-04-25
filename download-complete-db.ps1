# Download COMPLETE database with all data

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "Downloading COMPLETE database..." -ForegroundColor Cyan
Write-Host "Expected size: ~80MB" -ForegroundColor Yellow
Write-Host ""

$outputFile = "inventory_complete_backup.sql"

# Create complete dump with all data, routines, triggers, etc.
Write-Host "Creating complete dump on server..." -ForegroundColor Yellow
$dumpCmd = 'sudo mysqldump -u root --single-transaction --routines --triggers --all-databases > /tmp/complete_backup.sql'
ssh -i $sshKey $sshHost $dumpCmd

Write-Host "Checking dump size on server..." -ForegroundColor Yellow
$sizeCheck = ssh -i $sshKey $sshHost 'ls -lh /tmp/complete_backup.sql'
Write-Host $sizeCheck

# Download the complete file
Write-Host "Downloading complete database file..." -ForegroundColor Yellow
scp -i $sshKey "${sshHost}:/tmp/complete_backup.sql" $outputFile

# Cleanup server
Write-Host "Cleaning up server..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost 'sudo rm /tmp/complete_backup.sql'

if (Test-Path $outputFile) {
    $fileSize = (Get-Item $outputFile).Length / 1MB
    $fileSizeMB = [math]::Round($fileSize, 2)
    Write-Host ""
    Write-Host "SUCCESS! Complete database downloaded: $outputFile" -ForegroundColor Green
    Write-Host "File size: $fileSizeMB MB" -ForegroundColor Green
    
    if ($fileSizeMB -lt 50) {
        Write-Host ""
        Write-Host "WARNING: File size seems small for complete database!" -ForegroundColor Red
        Write-Host "Expected ~80MB, got $fileSizeMB MB" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "FAILED to download database!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next: Run analyze script to see all tables" -ForegroundColor Cyan