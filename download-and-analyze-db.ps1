# Database Download and Analysis Script (PowerShell)
# This script downloads the database from the server and analyzes its structure

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Download & Analysis Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Configuration
$PEM_KEY = "C:\Users\Public\pem.pem"
$SSH_USER = "ubuntu"
$SSH_HOST = "54.169.102.51"
$DB_USER = "inventory_user"
$DB_PASSWORD = "StrongPass@123"
$DB_NAME = "inventory_db"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$LOCAL_DUMP_FILE = "database_dump_$TIMESTAMP.sql"
$ANALYSIS_FILE = "database_analysis_$TIMESTAMP.txt"

Write-Host ""
Write-Host "Step 1: Downloading database dump from server..." -ForegroundColor Yellow
Write-Host "SSH: $SSH_USER@$SSH_HOST" -ForegroundColor Gray
Write-Host "Database: $DB_NAME" -ForegroundColor Gray
Write-Host ""

try {
    # Create SSH command to dump database
    $sshCommand = "mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME"
    
    # Execute SSH and capture output
    Write-Host "Executing: ssh -i $PEM_KEY $SSH_USER@$SSH_HOST '$sshCommand'" -ForegroundColor Gray
    $output = ssh -i $PEM_KEY "$SSH_USER@$SSH_HOST" $sshCommand
    
    # Save to file
    $output | Out-File -FilePath $LOCAL_DUMP_FILE -Encoding UTF8
    
    Write-Host "✅ Database dump downloaded: $LOCAL_DUMP_FILE" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error downloading database: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Step 2: Analyzing database structure..." -ForegroundColor Yellow
Write-Host ""

# Read the dump file
$dumpContent = Get-Content $LOCAL_DUMP_FILE -Raw

# Analyze and create report
$analysis = @()
$analysis += "=========================================="
$analysis += "DATABASE STRUCTURE ANALYSIS"
$analysis += "Generated: $(Get-Date)"
$analysis += "=========================================="
$analysis += ""

# Extract tables
$analysis += "TABLES IN DATABASE:"
$analysis += "===================="
$tableMatches = [regex]::Matches($dumpContent, "CREATE TABLE \`([^\`]+)\`")
foreach ($match in $tableMatches) {
    $analysis += $match.Groups[1].Value
}
$analysis += ""

# Extract CREATE TABLE statements (first 30 lines of each)
$analysis += "TABLE DETAILS:"
$analysis += "=============="
$createMatches = [regex]::Matches($dumpContent, "CREATE TABLE[^;]+;", [System.Text.RegularExpressions.RegexOptions]::Singleline)
foreach ($match in $createMatches | Select-Object -First 5) {
    $lines = $match.Value -split "`n" | Select-Object -First 20
    $analysis += $lines
    $analysis += ""
}

# Extract indexes
$analysis += "INDEXES:"
$analysis += "========"
$indexMatches = [regex]::Matches($dumpContent, ".*KEY.*")
foreach ($match in $indexMatches | Select-Object -First 30) {
    $analysis += $match.Value
}
$analysis += ""

# Extract foreign keys
$analysis += "FOREIGN KEYS:"
$analysis += "============="
$fkMatches = [regex]::Matches($dumpContent, ".*FOREIGN KEY.*")
foreach ($match in $fkMatches) {
    $analysis += $match.Value
}
$analysis += ""

# Count INSERT statements
$analysis += "SAMPLE DATA COUNTS:"
$analysis += "==================="
$insertMatches = [regex]::Matches($dumpContent, "INSERT INTO \`([^\`]+)\`")
$insertCounts = @{}
foreach ($match in $insertMatches) {
    $tableName = $match.Groups[1].Value
    if ($insertCounts.ContainsKey($tableName)) {
        $insertCounts[$tableName]++
    } else {
        $insertCounts[$tableName] = 1
    }
}
foreach ($table in $insertCounts.Keys | Sort-Object) {
    $analysis += "$($insertCounts[$table]) rows in $table"
}
$analysis += ""

# Save analysis
$analysis | Out-File -FilePath $ANALYSIS_FILE -Encoding UTF8

Write-Host "✅ Analysis saved to: $ANALYSIS_FILE" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ANALYSIS RESULTS:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Get-Content $ANALYSIS_FILE | Write-Host

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FILES CREATED:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. Database Dump: $LOCAL_DUMP_FILE" -ForegroundColor Green
Write-Host "2. Analysis Report: $ANALYSIS_FILE" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the analysis report above" -ForegroundColor Gray
Write-Host "2. Check if these tables exist:" -ForegroundColor Gray
Write-Host "   - inventory_transfers" -ForegroundColor Gray
Write-Host "   - transfer_items" -ForegroundColor Gray
Write-Host "   - timeline_events" -ForegroundColor Gray
Write-Host "3. If tables don't exist, run migration:" -ForegroundColor Gray
Write-Host "   mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < migrations/self_transfer_timeline.sql" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan
