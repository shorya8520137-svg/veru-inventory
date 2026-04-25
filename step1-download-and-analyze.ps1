# STEP 1: Download database and analyze structure
# DO NOT run any DELETE/TRUNCATE queries yet!

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "STEP 1: DOWNLOAD & ANALYZE DATABASE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. DOWNLOAD DATABASE BACKUP
# ============================================
Write-Host "Downloading database backup..." -ForegroundColor Yellow
Write-Host ""

$outputFile = "inventory_backup.sql"

# Execute mysqldump on server and download
$dumpCmd = 'sudo mysqldump -u root inventory_db > /tmp/inventory_backup.sql 2>&1; cat /tmp/inventory_backup.sql'
ssh -i $sshKey $sshHost $dumpCmd | Out-File -FilePath $outputFile -Encoding UTF8

if (Test-Path $outputFile) {
    $fileSize = (Get-Item $outputFile).Length / 1MB
    $fileSizeMB = [math]::Round($fileSize, 2)
    Write-Host "Database downloaded: $outputFile" -ForegroundColor Green
    Write-Host "File size: $fileSizeMB MB" -ForegroundColor Green
    
    $cleanupCmd = 'sudo rm /tmp/inventory_backup.sql'
    ssh -i $sshKey $sshHost $cleanupCmd
} else {
    Write-Host "Failed to download database!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 2. LIST ALL TABLES
# ============================================
Write-Host "Getting all tables in inventory_db..." -ForegroundColor Yellow
Write-Host ""

$showTablesCmd = "sudo mysql inventory_db -e 'SHOW TABLES;'"
ssh -i $sshKey $sshHost $showTablesCmd | Out-File -FilePath "all_tables.txt" -Encoding UTF8

Get-Content "all_tables.txt"

Write-Host ""
Write-Host "Table list saved to: all_tables.txt" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 3. ANALYZE EACH TABLE
# ============================================
Write-Host "Analyzing table structures and row counts..." -ForegroundColor Yellow
Write-Host ""

# Get list of tables (skip header)
$tables = Get-Content "all_tables.txt" | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne "" }

$analysisReport = @()
$analysisReport += "============================================"
$analysisReport += "DATABASE ANALYSIS REPORT"
$analysisReport += "Database: inventory_db"
$analysisReport += "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$analysisReport += "============================================"
$analysisReport += ""

foreach ($table in $tables) {
    $tableName = $table.Trim()
    if ($tableName -eq "") { continue }
    
    Write-Host "Analyzing: $tableName" -ForegroundColor Cyan
    
    $analysisReport += "TABLE: $tableName"
    $analysisReport += "----------------------------------------"
    
    # Get table structure
    $describeCmd = "sudo mysql inventory_db -e 'DESCRIBE $tableName;'"
    $structure = ssh -i $sshKey $sshHost $describeCmd
    $analysisReport += $structure
    $analysisReport += ""
    
    # Get row count
    $countCmd = "sudo mysql inventory_db -e 'SELECT COUNT(*) as row_count FROM $tableName;'"
    $rowCount = ssh -i $sshKey $sshHost $countCmd
    $analysisReport += "ROW COUNT:"
    $analysisReport += $rowCount
    $analysisReport += ""
    $analysisReport += "============================================"
    $analysisReport += ""
}

# Save analysis report
$analysisReport | Out-File -FilePath "database_analysis_report.txt" -Encoding UTF8

Write-Host ""
Write-Host "Analysis complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  1. inventory_backup.sql - Full database backup" -ForegroundColor White
Write-Host "  2. all_tables.txt - List of all tables" -ForegroundColor White
Write-Host "  3. database_analysis_report.txt - Detailed analysis" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Review database_analysis_report.txt" -ForegroundColor White
Write-Host "2. Identify which tables need to be emptied" -ForegroundColor White
Write-Host "3. Create SQL script based on actual structure" -ForegroundColor White
Write-Host ""
Write-Host "DO NOT run any DELETE queries until you review the analysis" -ForegroundColor Red
Write-Host ""
