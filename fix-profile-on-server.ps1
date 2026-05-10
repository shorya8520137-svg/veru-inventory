# ============================================
# Fix Profile System on Server
# ============================================
# This script:
# 1. Creates user_profiles table
# 2. Ensures uploads directory exists
# 3. Restarts the server
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Profile System Fix Deployment" -ForegroundColor Cyan
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

# Step 1: Create user_profiles table
Write-Host "[2/5] Creating user_profiles table..." -ForegroundColor Yellow
$createTable = @"
sudo mysql -e "
USE $DB_NAME;

CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    profile_image VARCHAR(500) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO user_profiles (user_id, profile_image, phone, address)
SELECT u.id, NULL, NULL, NULL
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.id IS NULL;

SELECT 'user_profiles table created and populated!' AS status;
"
"@

ssh -i $SSH_KEY $SSH_HOST $createTable
Write-Host ""

# Step 2: Ensure uploads directory exists
Write-Host "[3/5] Creating uploads directory..." -ForegroundColor Yellow
$createUploads = @"
cd ~/veru-inventory && mkdir -p uploads && chmod 755 uploads && echo 'Uploads directory ready'
"@

ssh -i $SSH_KEY $SSH_HOST $createUploads
Write-Host ""

# Step 3: Verify database structure
Write-Host "[4/5] Verifying database structure..." -ForegroundColor Yellow
$verifyDb = @"
sudo mysql -e "USE $DB_NAME; DESCRIBE user_profiles;"
"@

ssh -i $SSH_KEY $SSH_HOST $verifyDb
Write-Host ""

# Step 4: Restart server
Write-Host "[5/5] Restarting server..." -ForegroundColor Yellow
$restartServer = @"
cd ~/veru-inventory && pm2 restart all && pm2 logs --lines 20
"@

ssh -i $SSH_KEY $SSH_HOST $restartServer
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Profile System Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WHAT WAS FIXED:" -ForegroundColor Yellow
Write-Host "✓ Created user_profiles table" -ForegroundColor Green
Write-Host "✓ Added profile entries for existing users" -ForegroundColor Green
Write-Host "✓ Created uploads directory for profile images" -ForegroundColor Green
Write-Host "✓ Restarted server" -ForegroundColor Green
Write-Host ""
Write-Host "TEST THE FIX:" -ForegroundColor Yellow
Write-Host "1. Login to https://insora.in" -ForegroundColor White
Write-Host "2. Go to Profile page" -ForegroundColor White
Write-Host "3. Your name should now display correctly" -ForegroundColor White
Write-Host "4. Try uploading a profile image" -ForegroundColor White
Write-Host "5. Reload the page - image should persist" -ForegroundColor White
Write-Host ""
