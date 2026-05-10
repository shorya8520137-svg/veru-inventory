# ============================================
# Download Complete Database Schema
# ============================================
# This script downloads the complete database
# structure and schema for local analysis
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Schema Download Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SSH_HOST = "ubuntu@13.62.99.152"
$DB_NAME = "inventory_db"
$OUTPUT_DIR = "database-backup"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Create output directory
if (-not (Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
}

Write-Host "[1/5] Downloading database schema (structure only)..." -ForegroundColor Yellow
Write-Host "Output: $OUTPUT_DIR/schema_$TIMESTAMP.sql" -ForegroundColor Gray
Write-Host ""

# Download schema only (no data)
$downloadSchema = @"
sudo mysqldump --no-data --skip-add-drop-table --skip-comments $DB_NAME > /tmp/schema_$TIMESTAMP.sql && cat /tmp/schema_$TIMESTAMP.sql
"@

$schemaContent = ssh -i $SSH_KEY $SSH_HOST $downloadSchema
$schemaContent | Out-File -FilePath "$OUTPUT_DIR\schema_$TIMESTAMP.sql" -Encoding UTF8

Write-Host "[OK] Schema downloaded" -ForegroundColor Green
Write-Host ""

# Download table list
Write-Host "[2/5] Downloading table list..." -ForegroundColor Yellow
$tableList = @"
sudo mysql -e 'USE $DB_NAME; SHOW TABLES;'
"@

$tables = ssh -i $SSH_KEY $SSH_HOST $tableList
$tables | Out-File -FilePath "$OUTPUT_DIR\tables_$TIMESTAMP.txt" -Encoding UTF8

Write-Host "[OK] Table list downloaded" -ForegroundColor Green
Write-Host ""

# Download detailed structure for user-related tables
Write-Host "[3/5] Downloading user-related table structures..." -ForegroundColor Yellow

$userTables = @"
sudo mysql -e "
USE $DB_NAME;

SELECT '=== USERS TABLE ===' AS '';
DESCRIBE users;
SELECT '' AS '';
SELECT 'Sample data:' AS '';
SELECT id, name, email, role_id, is_active, created_at FROM users LIMIT 3;

SELECT '' AS '';
SELECT '=== USER_PROFILES TABLE ===' AS '';
SHOW TABLES LIKE 'user_profiles';
DESCRIBE user_profiles;
SELECT '' AS '';
SELECT 'Sample data:' AS '';
SELECT * FROM user_profiles LIMIT 3;

SELECT '' AS '';
SELECT '=== WEBSITE_CUSTOMERS TABLE ===' AS '';
SHOW TABLES LIKE 'website_customers';
DESCRIBE website_customers;
SELECT '' AS '';
SELECT 'Sample data:' AS '';
SELECT id, name, email, phone, is_active, created_at FROM website_customers LIMIT 3;
" 2>&1
"@

$userTablesContent = ssh -i $SSH_KEY $SSH_HOST $userTables
$userTablesContent | Out-File -FilePath "$OUTPUT_DIR\user_tables_$TIMESTAMP.txt" -Encoding UTF8

Write-Host "[OK] User tables structure downloaded" -ForegroundColor Green
Write-Host ""

# Download foreign key relationships
Write-Host "[4/5] Downloading foreign key relationships..." -ForegroundColor Yellow
$foreignKeys = @"
sudo mysql -e "
USE $DB_NAME;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = '$DB_NAME'
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;
"
"@

$fkContent = ssh -i $SSH_KEY $SSH_HOST $foreignKeys
$fkContent | Out-File -FilePath "$OUTPUT_DIR\foreign_keys_$TIMESTAMP.txt" -Encoding UTF8

Write-Host "[OK] Foreign keys downloaded" -ForegroundColor Green
Write-Host ""

# Create analysis report
Write-Host "[5/5] Creating analysis report..." -ForegroundColor Yellow

$analysisReport = @"
# Database Structure Analysis Report
Generated: $TIMESTAMP
Database: $DB_NAME
Server: $SSH_HOST

## Files Generated:
1. schema_$TIMESTAMP.sql - Complete database schema (structure only)
2. tables_$TIMESTAMP.txt - List of all tables
3. user_tables_$TIMESTAMP.txt - Detailed structure of user-related tables
4. foreign_keys_$TIMESTAMP.txt - Foreign key relationships

## Next Steps:
1. Review user_tables_$TIMESTAMP.txt to understand current structure
2. Identify if user_profiles table exists and its relationship to users table
3. Check if website_customers is separate (DO NOT MODIFY)
4. Determine what columns are missing in users table
5. Create fix script based on actual database structure

## Important Notes:
- users table = Inventory system users (admin, staff, etc.)
- website_customers table = Website customers (DO NOT TOUCH)
- user_profiles table = Extended profile data for inventory users (if exists)

## Analysis Questions:
1. Does users table have avatar, phone, address columns?
2. Does user_profiles table exist?
3. If user_profiles exists, is it properly linked to users table?
4. What is the current profile data storage structure?
5. Which endpoint should the frontend use?

"@

$analysisReport | Out-File -FilePath "$OUTPUT_DIR\ANALYSIS_REPORT_$TIMESTAMP.md" -Encoding UTF8

Write-Host "[OK] Analysis report created" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Download Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "FILES SAVED TO: $OUTPUT_DIR" -ForegroundColor Yellow
Write-Host ""
Write-Host "REVIEW THESE FILES:" -ForegroundColor Yellow
Write-Host "1. user_tables_$TIMESTAMP.txt - Check user table structures" -ForegroundColor White
Write-Host "2. schema_$TIMESTAMP.sql - Full database schema" -ForegroundColor White
Write-Host "3. foreign_keys_$TIMESTAMP.txt - Table relationships" -ForegroundColor White
Write-Host "4. ANALYSIS_REPORT_$TIMESTAMP.md - Analysis guide" -ForegroundColor White
Write-Host ""
Write-Host "Opening files for review..." -ForegroundColor Gray
Start-Process notepad.exe "$OUTPUT_DIR\user_tables_$TIMESTAMP.txt"
Write-Host ""
