# Simple Database Download Script
$PEM_KEY = "C:\Users\Public\pem.pem"
$SSH_USER = "ubuntu"
$SSH_HOST = "54.169.102.51"
$DB_USER = "inventory_user"
$DB_PASSWORD = "StrongPass@123"
$DB_NAME = "inventory_db"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$LOCAL_DUMP_FILE = "database_dump_$TIMESTAMP.sql"

Write-Host "Downloading database from $SSH_HOST..." -ForegroundColor Cyan

$sshCommand = "mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME"
ssh -i $PEM_KEY "$SSH_USER@$SSH_HOST" $sshCommand | Out-File -FilePath $LOCAL_DUMP_FILE -Encoding UTF8

Write-Host "Database downloaded to: $LOCAL_DUMP_FILE" -ForegroundColor Green
Write-Host ""
Write-Host "Analyzing structure..." -ForegroundColor Cyan

$content = Get-Content $LOCAL_DUMP_FILE -Raw

# Find all CREATE TABLE statements
$tables = [regex]::Matches($content, "CREATE TABLE \`([^\`]+)\`") | ForEach-Object { $_.Groups[1].Value }

Write-Host ""
Write-Host "TABLES FOUND:" -ForegroundColor Yellow
$tables | ForEach-Object { Write-Host "  - $_" }

Write-Host ""
Write-Host "Checking for Self Transfer tables..." -ForegroundColor Yellow
$requiredTables = @("inventory_transfers", "transfer_items", "timeline_events")
foreach ($table in $requiredTables) {
    if ($tables -contains $table) {
        Write-Host "  OK: $table EXISTS" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $table" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Full dump file: $LOCAL_DUMP_FILE" -ForegroundColor Gray
