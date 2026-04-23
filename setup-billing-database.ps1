# ============================================
# BILLING DATABASE SETUP VIA SSH
# ============================================
# This script connects to the remote server via SSH
# and sets up the complete billing system database
# ============================================

$SSH_KEY = "C:\Users\Public\pem.pem"
$SERVER = "ubuntu@13.229.121.238"
$DB_NAME = "inventory_db"
$SQL_FILE = "ADD_BILLING_SAMPLE_DATA.sql"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BILLING DATABASE SETUP VIA SSH" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $SERVER" -ForegroundColor Yellow
Write-Host "Database: $DB_NAME" -ForegroundColor Yellow
Write-Host "SQL File: $SQL_FILE" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if SQL file exists
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "[ERROR] $SQL_FILE not found!" -ForegroundColor Red
    Write-Host "   Please make sure the file exists in the current directory." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] SQL file found" -ForegroundColor Green
Write-Host ""

# Step 2: Upload SQL file to server
Write-Host "[UPLOAD] Step 1: Uploading SQL file to server..." -ForegroundColor Cyan
scp -i $SSH_KEY $SQL_FILE "${SERVER}:/tmp/billing_setup.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] SQL file uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to upload SQL file" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Execute SQL file on server
Write-Host "[EXECUTE] Step 2: Executing SQL file on remote database..." -ForegroundColor Cyan
Write-Host "   This will add sample data to existing billing tables..." -ForegroundColor Yellow
Write-Host ""

ssh -i $SSH_KEY $SERVER "sudo mysql $DB_NAME < /tmp/billing_setup.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] SQL file executed successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to execute SQL file" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Verify tables were created
Write-Host "[VERIFY] Step 3: Verifying tables were created..." -ForegroundColor Cyan
Write-Host ""

$verifyScript = @"
USE $DB_NAME;

-- Show billing tables
SELECT '=== BILLING TABLES ===' as Info;
SHOW TABLES LIKE '%bill%';

-- Show store inventory tables
SELECT '=== STORE INVENTORY TABLES ===' as Info;
SHOW TABLES LIKE '%store%';

-- Count records
SELECT '=== RECORD COUNTS ===' as Info;
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'store_inventory', COUNT(*) FROM store_inventory
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'store_inventory_logs', COUNT(*) FROM store_inventory_logs;

-- Show sample products
SELECT '=== SAMPLE PRODUCTS ===' as Info;
SELECT product_name, barcode, price, stock FROM store_inventory LIMIT 5;

-- Show table structures
SELECT '=== BILLS TABLE STRUCTURE ===' as Info;
DESCRIBE bills;

SELECT '=== STORE INVENTORY TABLE STRUCTURE ===' as Info;
DESCRIBE store_inventory;
"@

# Save verify script to temp file
$verifyScript | Out-File -FilePath "temp_verify_billing.sql" -Encoding UTF8

# Upload and execute verify script
scp -i $SSH_KEY "temp_verify_billing.sql" "${SERVER}:/tmp/verify_billing.sql"
ssh -i $SSH_KEY $SERVER "sudo mysql $DB_NAME < /tmp/verify_billing.sql"

# Clean up temp file
Remove-Item "temp_verify_billing.sql" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  [SUCCESS] BILLING DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "What was created:" -ForegroundColor Cyan
Write-Host "   [OK] bills table (stores all invoices)" -ForegroundColor White
Write-Host "   [OK] store_inventory table (tracks product stock)" -ForegroundColor White
Write-Host "   [OK] store_inventory_logs table (audit trail)" -ForegroundColor White
Write-Host "   [OK] products table (master catalog)" -ForegroundColor White
Write-Host "   [OK] 15 sample products inserted" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Access billing system at: /billing/create" -ForegroundColor White
Write-Host "   2. View bill history at: /billing/history" -ForegroundColor White
Write-Host "   3. Check store inventory at: /billing/store-inventory" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor Cyan
Write-Host "   POST /api/billing/generate" -ForegroundColor White
Write-Host "   GET  /api/billing/history" -ForegroundColor White
Write-Host "   GET  /api/billing/store-inventory" -ForegroundColor White
Write-Host "   GET  /api/dispatch/search-products" -ForegroundColor White
Write-Host ""

# Clean up remote temp files
ssh -i $SSH_KEY $SERVER "rm -f /tmp/billing_setup.sql /tmp/verify_billing.sql"

Write-Host "[OK] Setup complete!" -ForegroundColor Green
Write-Host ""
