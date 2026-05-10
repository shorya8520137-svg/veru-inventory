# ============================================
# Simple Profile Fix Script
# ============================================
# This script ONLY:
# 1. Ensures all users have user_profiles entries
# 2. Creates uploads directory with correct permissions
# 3. Verifies nginx configuration
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Profile System Simple Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SSH_HOST = "ubuntu@13.62.99.152"
$DB_NAME = "inventory_db"

Write-Host "[1/4] Ensuring all users have user_profiles entries..." -ForegroundColor Yellow
$ensureProfiles = @'
sudo mysql -e "
USE inventory_db;

-- Show users without profiles
SELECT 'Users without profiles:' AS '';
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.id IS NULL;

-- Create missing profiles
INSERT INTO user_profiles (user_id, profile_image, phone, address)
SELECT u.id, NULL, NULL, NULL
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.id IS NULL;

SELECT 'Profiles created!' AS '';

-- Verify all users now have profiles
SELECT 'Total users:' AS '', COUNT(*) AS count FROM users;
SELECT 'Total profiles:' AS '', COUNT(*) AS count FROM user_profiles;
"
'@

ssh -i $SSH_KEY $SSH_HOST $ensureProfiles
Write-Host ""

Write-Host "[2/4] Creating uploads directory..." -ForegroundColor Yellow
$createUploads = @'
cd ~/veru-inventory && \
mkdir -p uploads && \
chmod 755 uploads && \
chown ubuntu:ubuntu uploads && \
ls -la uploads && \
echo "Uploads directory ready!"
'@

ssh -i $SSH_KEY $SSH_HOST $createUploads
Write-Host ""

Write-Host "[3/4] Checking nginx configuration..." -ForegroundColor Yellow
$checkNginx = @'
sudo nginx -t && echo "Nginx config OK" || echo "Nginx config has errors"
'@

ssh -i $SSH_KEY $SSH_HOST $checkNginx
Write-Host ""

Write-Host "[4/4] Restarting server..." -ForegroundColor Yellow
$restartServer = @'
cd ~/veru-inventory && pm2 restart all && sleep 2 && pm2 logs --lines 10
'@

ssh -i $SSH_KEY $SSH_HOST $restartServer
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WHAT WAS DONE:" -ForegroundColor Yellow
Write-Host "1. Created user_profiles entries for users without them" -ForegroundColor White
Write-Host "2. Created/verified uploads directory" -ForegroundColor White
Write-Host "3. Checked nginx configuration" -ForegroundColor White
Write-Host "4. Restarted server" -ForegroundColor White
Write-Host ""
Write-Host "TEST NOW:" -ForegroundColor Yellow
Write-Host "1. Login to https://insora.in" -ForegroundColor White
Write-Host "2. Go to Profile page" -ForegroundColor White
Write-Host "3. Your name should display correctly" -ForegroundColor White
Write-Host "4. Try uploading a profile image" -ForegroundColor White
Write-Host ""
