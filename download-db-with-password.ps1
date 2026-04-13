Write-Host "Downloading inventory_backup_final.sql from Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: You will be prompted for the server password" -ForegroundColor Yellow
Write-Host ""

$SERVER = "ubuntu@54.251.22.246"
$REMOTE_FILE = "inventory_backup_final.sql"
$LOCAL_FILE = "inventory_backup_final.sql"

Write-Host "Checking if file exists on server..." -ForegroundColor Yellow
Write-Host "Command: ssh $SERVER ls -lh ~/$REMOTE_FILE" -ForegroundColor Gray
Write-Host ""

# Use pscp if available (PuTTY), otherwise use scp
$pscpPath = Get-Command pscp -ErrorAction SilentlyContinue

if ($pscpPath) {
    Write-Host "Using PuTTY's pscp for download..." -ForegroundColor Cyan
    pscp "${SERVER}:${REMOTE_FILE}" "./$LOCAL_FILE"
} else {
    Write-Host "Using OpenSSH scp for download..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "If you don't have SSH key set up, you can:" -ForegroundColor Yellow
    Write-Host "1. Use WinSCP (GUI tool) to download the file" -ForegroundColor White
    Write-Host "2. Or use this command manually:" -ForegroundColor White
    Write-Host "   scp ${SERVER}:${REMOTE_FILE} ./" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Attempting download..." -ForegroundColor Cyan
    
    # Try with scp
    scp "${SERVER}:${REMOTE_FILE}" "./$LOCAL_FILE"
}

if (Test-Path $LOCAL_FILE) {
    Write-Host "`n✅ Download Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "File Details:" -ForegroundColor Cyan
    $file = Get-Item $LOCAL_FILE
    Write-Host "  Name: $($file.Name)" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($file.Length/1MB,2)) MB" -ForegroundColor White
    Write-Host "  Path: $($file.FullName)" -ForegroundColor White
    Write-Host ""
    Write-Host "Database downloaded successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Download Failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative methods:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Use WinSCP (Recommended for Windows):" -ForegroundColor Cyan
    Write-Host "   - Download: https://winscp.net/eng/download.php" -ForegroundColor Gray
    Write-Host "   - Host: 54.251.22.246" -ForegroundColor Gray
    Write-Host "   - Username: ubuntu" -ForegroundColor Gray
    Write-Host "   - File: /home/ubuntu/inventory_backup_final.sql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Use FileZilla:" -ForegroundColor Cyan
    Write-Host "   - Protocol: SFTP" -ForegroundColor Gray
    Write-Host "   - Host: 54.251.22.246" -ForegroundColor Gray
    Write-Host "   - Port: 22" -ForegroundColor Gray
    Write-Host "   - Username: ubuntu" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Manual SCP command:" -ForegroundColor Cyan
    Write-Host "   scp ubuntu@54.251.22.246:~/inventory_backup_final.sql ./" -ForegroundColor Gray
}
