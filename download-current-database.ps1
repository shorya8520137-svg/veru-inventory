# LIGHTWEIGHT DATABASE DOWNLOAD SCRIPT
# Downloads current database from server without hanging issues

Write-Host "📥 DOWNLOADING CURRENT DATABASE" -ForegroundColor Cyan
Write-Host "=" * 40

$serverIP = "13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"
$dbName = "inventory_db"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "inventory_current_$timestamp.sql"

Write-Host "🌐 Server: $serverIP" -ForegroundColor Yellow
Write-Host "🗄️  Database: $dbName" -ForegroundColor Yellow
Write-Host "📁 Output: $backupFile" -ForegroundColor Yellow

# Step 1: Test SSH connection first
Write-Host "`n🔍 Testing SSH connection..." -ForegroundColor Yellow
$testCommand = "echo 'SSH connection successful'"
$testResult = ssh -i $sshKey -o ConnectTimeout=10 -o BatchMode=yes "ubuntu@$serverIP" $testCommand 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH connection failed" -ForegroundColor Red
    Write-Host "Error: $testResult" -ForegroundColor Red
    exit 1
}
Write-Host "✅ SSH connection successful" -ForegroundColor Green

# Step 2: Check if MySQL is running
Write-Host "`n🔍 Checking MySQL status..." -ForegroundColor Yellow
$mysqlCheck = ssh -i $sshKey -o ConnectTimeout=10 "ubuntu@$serverIP" "sudo systemctl is-active mysql" 2>&1

if ($mysqlCheck -ne "active") {
    Write-Host "❌ MySQL is not running on server" -ForegroundColor Red
    Write-Host "Status: $mysqlCheck" -ForegroundColor Red
    exit 1
}
Write-Host "✅ MySQL is running" -ForegroundColor Green

# Step 3: Create database dump with timeout and compression
Write-Host "`n📥 Creating database dump..." -ForegroundColor Yellow

# Use a lightweight dump command with specific tables only
$dumpCommand = @"
timeout 300 mysqldump -u root --single-transaction --routines --triggers \
--add-drop-table --disable-keys --extended-insert=FALSE \
$dbName \
inventory_ledger_base \
stock_batches \
self_transfer \
self_transfer_items \
dispatch_product \
> /tmp/$backupFile 2>/dev/null
echo "DUMP_STATUS:\$?"
"@

Write-Host "⏱️  Timeout: 5 minutes" -ForegroundColor Gray
Write-Host "📊 Tables: inventory_ledger_base, stock_batches, self_transfer, self_transfer_items, dispatch_product" -ForegroundColor Gray

$dumpResult = ssh -i $sshKey -o ConnectTimeout=15 "ubuntu@$serverIP" $dumpCommand

# Check if dump was successful
if ($dumpResult -match "DUMP_STATUS:0") {
    Write-Host "✅ Database dump created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Database dump failed" -ForegroundColor Red
    Write-Host "Result: $dumpResult" -ForegroundColor Red
    exit 1
}

# Step 4: Check dump file size
Write-Host "`n📏 Checking dump file size..." -ForegroundColor Yellow
$sizeCheck = ssh -i $sshKey "ubuntu@$serverIP" "ls -lh /tmp/$backupFile | awk '{print \$5}'"

if ([string]::IsNullOrEmpty($sizeCheck)) {
    Write-Host "❌ Dump file not found or empty" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Dump file size: $sizeCheck" -ForegroundColor Green

# Step 5: Download the dump file with progress
Write-Host "`n⬇️  Downloading dump file..." -ForegroundColor Yellow

# Use SCP with compression and progress
$scpCommand = "scp -i `"$sshKey`" -C -o ConnectTimeout=30 ubuntu@${serverIP}:/tmp/$backupFile ./"

try {
    $process = Start-Process -FilePath "scp" -ArgumentList "-i", $sshKey, "-C", "-o", "ConnectTimeout=30", "ubuntu@${serverIP}:/tmp/$backupFile", "./" -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Download completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Download failed with exit code: $($process.ExitCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Download error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Verify downloaded file
if (Test-Path $backupFile) {
    $localSize = (Get-Item $backupFile).Length
    $localSizeMB = [math]::Round($localSize / 1MB, 2)
    Write-Host "✅ File downloaded: $backupFile ($localSizeMB MB)" -ForegroundColor Green
} else {
    Write-Host "❌ Downloaded file not found" -ForegroundColor Red
    exit 1
}

# Step 7: Clean up server temp file
Write-Host "`n🧹 Cleaning up server temp file..." -ForegroundColor Yellow
ssh -i $sshKey "ubuntu@$serverIP" "rm -f /tmp/$backupFile"
Write-Host "✅ Server cleanup completed" -ForegroundColor Green

# Step 8: Quick validation of downloaded file
Write-Host "`n🔍 Validating downloaded file..." -ForegroundColor Yellow
$firstLines = Get-Content $backupFile -Head 5
if ($firstLines -match "MySQL dump") {
    Write-Host "✅ File appears to be a valid MySQL dump" -ForegroundColor Green
} else {
    Write-Host "⚠️  File may be corrupted or incomplete" -ForegroundColor Yellow
}

Write-Host "`n🎉 DATABASE DOWNLOAD COMPLETED!" -ForegroundColor Green
Write-Host "📁 File: $backupFile" -ForegroundColor Cyan
Write-Host "📊 Size: $localSizeMB MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Analyze the current database state" -ForegroundColor White
Write-Host "  2. Identify the exact inventory synchronization issue" -ForegroundColor White
Write-Host "  3. Create targeted fix for the problem" -ForegroundColor White