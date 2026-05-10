# ============================================
# Profile Issue Diagnostic Script
# ============================================
# This script connects to the server via SSH and checks:
# 1. Database structure (users table columns)
# 2. Sample user data
# 3. Profile API endpoint availability
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Profile Issue Diagnostic Tool" -ForegroundColor Cyan
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

Write-Host "[1/5] Connecting to server..." -ForegroundColor Yellow
Write-Host "SSH: $SSH_HOST" -ForegroundColor Gray
Write-Host ""

# Step 1: Check database structure
Write-Host "[2/5] Checking users table structure..." -ForegroundColor Yellow
$checkStructure = @"
sudo mysql -e 'USE $DB_NAME; DESCRIBE users;'
"@

ssh -i $SSH_KEY $SSH_HOST $checkStructure
Write-Host ""

# Step 2: Check if user_profiles table exists
Write-Host "[3/5] Checking for user_profiles table..." -ForegroundColor Yellow
$checkUserProfiles = @"
sudo mysql -e "USE $DB_NAME; SHOW TABLES LIKE 'user_profiles';"
"@

ssh -i $SSH_KEY $SSH_HOST $checkUserProfiles
Write-Host ""

# Step 2b: Check user_profiles structure if it exists
Write-Host "[3b/5] Checking user_profiles table structure..." -ForegroundColor Yellow
$checkProfileStructure = @"
sudo mysql -e 'USE $DB_NAME; DESCRIBE user_profiles;' 2>/dev/null || echo 'user_profiles table does not exist'
"@

ssh -i $SSH_KEY $SSH_HOST $checkProfileStructure
Write-Host ""

# Step 3: Check sample user data
Write-Host "[4/5] Checking sample user data..." -ForegroundColor Yellow
$checkUsers = @"
sudo mysql -e 'USE $DB_NAME; SELECT id, name, email, role_id, created_at FROM users LIMIT 5;'
"@

ssh -i $SSH_KEY $SSH_HOST $checkUsers
Write-Host ""

# Step 4: Check if profile routes are registered
Write-Host "[5/5] Checking server.js for profile routes..." -ForegroundColor Yellow
$checkRoutes = @"
cd ~/veru-inventory && grep -n "profileRoutes\|/api/profile\|/api/users/profile" server.js
"@

ssh -i $SSH_KEY $SSH_HOST $checkRoutes
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnostic Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. If columns are missing, run the fix script" -ForegroundColor White
Write-Host "2. If routes are not registered, update server.js" -ForegroundColor White
Write-Host "3. Check if API endpoint returns correct user data" -ForegroundColor White
Write-Host ""
Write-Host "To add missing columns, run:" -ForegroundColor Yellow
Write-Host "ssh -i `"$SSH_KEY`" $SSH_HOST" -ForegroundColor Gray
Write-Host "sudo mysql" -ForegroundColor Gray
Write-Host "USE $DB_NAME;" -ForegroundColor Gray
Write-Host "ALTER TABLE users ADD COLUMN avatar VARCHAR(500) AFTER email;" -ForegroundColor Gray
Write-Host "ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER email;" -ForegroundColor Gray
Write-Host "ALTER TABLE users ADD COLUMN address TEXT AFTER phone;" -ForegroundColor Gray
Write-Host ""
