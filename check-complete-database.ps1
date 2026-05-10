# ============================================
# Complete Database Structure Check
# ============================================
# This script checks ALL tables in the database
# to understand the complete structure
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Database Structure Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SSH_HOST = "ubuntu@13.62.99.152"
$DB_NAME = "inventory_db"

# Check if SSH key exists
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "ERROR: SSH key not found at $SSH_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "[1/7] Connecting to server..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Show ALL tables in database
Write-Host "[2/7] Listing ALL tables in database..." -ForegroundColor Yellow
$showTables = @"
sudo mysql -e 'USE $DB_NAME; SHOW TABLES;'
"@

ssh -i $SSH_KEY $SSH_HOST $showTables
Write-Host ""

# Step 2: Check for user-related tables
Write-Host "[3/7] Checking for user-related tables..." -ForegroundColor Yellow
$checkUserTables = @"
sudo mysql -e "USE $DB_NAME; SHOW TABLES LIKE '%user%';"
"@

ssh -i $SSH_KEY $SSH_HOST $checkUserTables
Write-Host ""

# Step 3: Check 'users' table structure (inventory users)
Write-Host "[4/7] Checking 'users' table structure (INVENTORY USERS)..." -ForegroundColor Yellow
$checkUsers = @"
sudo mysql -e 'USE $DB_NAME; DESCRIBE users;'
"@

ssh -i $SSH_KEY $SSH_HOST $checkUsers
Write-Host ""

# Step 4: Check 'website_customers' table structure (website users)
Write-Host "[5/7] Checking 'website_customers' table structure (WEBSITE USERS)..." -ForegroundColor Yellow
$checkWebsiteCustomers = @"
sudo mysql -e 'USE $DB_NAME; DESCRIBE website_customers;' 2>/dev/null || echo 'website_customers table does not exist'
"@

ssh -i $SSH_KEY $SSH_HOST $checkWebsiteCustomers
Write-Host ""

# Step 5: Check 'user_profiles' table structure
Write-Host "[6/7] Checking 'user_profiles' table structure..." -ForegroundColor Yellow
$checkUserProfiles = @"
sudo mysql -e 'USE $DB_NAME; DESCRIBE user_profiles;' 2>/dev/null || echo 'user_profiles table does not exist'
"@

ssh -i $SSH_KEY $SSH_HOST $checkUserProfiles
Write-Host ""

# Step 6: Check sample data from users table
Write-Host "[7/7] Checking sample data from users table..." -ForegroundColor Yellow
$checkSampleData = @"
sudo mysql -e 'USE $DB_NAME; SELECT id, name, email, role_id, is_active, created_at FROM users LIMIT 5;'
"@

ssh -i $SSH_KEY $SSH_HOST $checkSampleData
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Check Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ANALYSIS:" -ForegroundColor Yellow
Write-Host "1. Check if 'users' table has avatar/phone/address columns" -ForegroundColor White
Write-Host "2. Check if 'user_profiles' table exists and is linked to 'users'" -ForegroundColor White
Write-Host "3. Verify 'website_customers' is separate (DO NOT TOUCH)" -ForegroundColor White
Write-Host "4. Identify what needs to be fixed for inventory user profiles" -ForegroundColor White
Write-Host ""
