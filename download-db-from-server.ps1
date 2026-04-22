# ============================================================
# AUTO DOWNLOAD DATABASE FROM SERVER TO LOCAL
# Server: 54.169.30.121  |  Key: C:\Users\Public\e2c.pem.pem
# ============================================================

$SSH_KEY   = "C:\Users\Public\e2c.pem.pem"
$SERVER    = "ubuntu@54.169.30.121"
$DB_USER   = "inventory_user"
$DB_PASS   = "StrongPass@123"
$DB_NAME   = "inventory_db"
$LOCAL_DIR = "$PSScriptRoot\db-backup"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$DUMP_FILE = "inventory_db_$TIMESTAMP.sql"

if (!(Test-Path $LOCAL_DIR)) {
    New-Item -ItemType Directory -Path $LOCAL_DIR | Out-Null
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " DB DOWNLOAD â€" $TIMESTAMP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Step 1: Test connection
Write-Host "`n[1/3] Testing SSH connection..." -ForegroundColor Yellow
$test = ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER "echo connected"
if ($test -ne "connected") {
    Write-Host "ERROR: Cannot connect. Output: $test" -ForegroundColor Red
    exit 1
}
Write-Host "      OK - Connected" -ForegroundColor Green

# Step 2: Dump DB on server
Write-Host "`n[2/3] Creating mysqldump on server..." -ForegroundColor Yellow
$dumpCmd = "mysqldump -h127.0.0.1 -u${DB_USER} -p${DB_PASS} ${DB_NAME} > /tmp/${DUMP_FILE}; echo EXIT_CODE:$?"
$result  = ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER $dumpCmd
Write-Host "      Server output: $result"
if ($result -notmatch "EXIT_CODE:0") {
    Write-Host "ERROR: mysqldump failed on server." -ForegroundColor Red
    exit 1
}
Write-Host "      Dump created: /tmp/$DUMP_FILE" -ForegroundColor Green

# Step 3: SCP download
Write-Host "`n[3/3] Downloading to local: $LOCAL_DIR\$DUMP_FILE ..." -ForegroundColor Yellow
scp -i $SSH_KEY -o StrictHostKeyChecking=no "${SERVER}:/tmp/${DUMP_FILE}" "$LOCAL_DIR\$DUMP_FILE"

if ($LASTEXITCODE -eq 0) {
    $size = [math]::Round((Get-Item "$LOCAL_DIR\$DUMP_FILE").Length / 1KB, 1)
    Write-Host "      Downloaded! Size: ${size} KB" -ForegroundColor Green
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "rm /tmp/${DUMP_FILE}" | Out-Null
    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host " SUCCESS: $LOCAL_DIR\$DUMP_FILE" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Host "ERROR: SCP download failed." -ForegroundColor Red
    exit 1
}

