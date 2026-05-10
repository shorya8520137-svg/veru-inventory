# ============================================
# Download Complete Database (Structure + Data)
# ============================================
# This script downloads the full database dump
# including all tables, data, and relationships
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Database Download" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SSH_HOST = "ubuntu@13.62.99.152"
$DB_NAME = "inventory_db"
$OUTPUT_DIR = "database-backup"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$DUMP_FILE = "complete_database_$TIMESTAMP.sql"
$LOCAL_FILE = "$OUTPUT_DIR\$DUMP_FILE"

# Create output directory
if (-not (Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
}

Write-Host "Database: $DB_NAME" -ForegroundColor Yellow
Write-Host "Output: $LOCAL_FILE" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: This will download ALL data from the database." -ForegroundColor Red
Write-Host "The file may be large (several MB)." -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Download cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/3] Creating database dump on server..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

# Create dump on server
$createDump = @"
sudo mysqldump --single-transaction --routines --triggers --events $DB_NAME > /tmp/$DUMP_FILE && echo 'Dump created successfully'
"@

$result = ssh -i $SSH_KEY $SSH_HOST $createDump
Write-Host $result
Write-Host ""

Write-Host "[2/3] Downloading database dump..." -ForegroundColor Yellow
Write-Host "Transferring file from server..." -ForegroundColor Gray

# Download the dump file using SCP
scp -i $SSH_KEY "${SSH_HOST}:/tmp/$DUMP_FILE" $LOCAL_FILE

if (Test-Path $LOCAL_FILE) {
    $fileSize = (Get-Item $LOCAL_FILE).Length / 1MB
    Write-Host "[OK] Downloaded: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Download failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[3/3] Cleaning up server..." -ForegroundColor Yellow
$cleanup = @"
rm -f /tmp/$DUMP_FILE && echo 'Cleanup complete'
"@

ssh -i $SSH_KEY $SSH_HOST $cleanup
Write-Host ""

# Create quick analysis
Write-Host "[BONUS] Creating quick analysis..." -ForegroundColor Yellow

$lineCount = (Get-Content $LOCAL_FILE | Measure-Object -Line).Lines
$userTables = Select-String -Path $LOCAL_FILE -Pattern "CREATE TABLE \`(users|user_profiles|website_customers)\`" -AllMatches

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Download Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "FILE DETAILS:" -ForegroundColor Yellow
Write-Host "Location: $LOCAL_FILE" -ForegroundColor White
Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
Write-Host "Lines: $lineCount" -ForegroundColor White
Write-Host ""
Write-Host "USER TABLES FOUND:" -ForegroundColor Yellow
foreach ($match in $userTables) {
    Write-Host "  - $($match.Line)" -ForegroundColor White
}
Write-Host ""
Write-Host "WHAT YOU CAN DO NOW:" -ForegroundColor Yellow
Write-Host "1. Open the SQL file in a text editor" -ForegroundColor White
Write-Host "2. Search for 'CREATE TABLE \`users\`' to see users table structure" -ForegroundColor White
Write-Host "3. Search for 'CREATE TABLE \`user_profiles\`' to see profiles table" -ForegroundColor White
Write-Host "4. Search for 'INSERT INTO \`users\`' to see actual user data" -ForegroundColor White
Write-Host "5. Import to local MySQL: mysql -u root -p database_name" -ForegroundColor White
Write-Host "   Then run: source $LOCAL_FILE" -ForegroundColor White
Write-Host ""
Write-Host "OPEN FILE NOW? (yes/no)" -ForegroundColor Yellow
$openFile = Read-Host
if ($openFile -eq 'yes') {
    Start-Process notepad.exe $LOCAL_FILE
}
Write-Host ""
Write-Host ""
