@echo off
REM ============================================
REM FINAL Profile Fix - Based on Database Analysis
REM ============================================
REM Problem: 25 out of 30 users don't have user_profiles entries
REM Solution: Create missing user_profiles entries
REM ============================================

echo ========================================
echo Profile System FINAL FIX
echo ========================================
echo.
echo PROBLEM IDENTIFIED:
echo - 25 out of 30 users are missing user_profiles entries
echo - This causes NULL data in API responses
echo - Frontend shows placeholder "Alexander Thompson"
echo.
echo SOLUTION:
echo - Create user_profiles entries for missing users
echo - No code changes needed
echo - No schema changes needed
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SSH_HOST=ubuntu@13.62.99.152

echo [1/3] Creating missing user_profiles entries...
echo.

ssh -i "%SSH_KEY%" %SSH_HOST% "sudo mysql -e \"USE inventory_db; SELECT 'Before fix - Users without profiles:' AS info, COUNT(*) AS count FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE up.id IS NULL; INSERT INTO user_profiles (user_id, profile_image, phone, address) SELECT u.id, NULL, NULL, NULL FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE up.id IS NULL; SELECT 'After fix - Total users:' AS info, COUNT(*) AS count FROM users; SELECT 'After fix - Total profiles:' AS info, COUNT(*) AS count FROM user_profiles; SELECT 'Users still without profiles:' AS info, COUNT(*) AS count FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE up.id IS NULL;\""

echo.
echo [2/3] Verifying uploads directory...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && mkdir -p uploads && chmod 755 uploads && ls -la uploads | head -5"

echo.
echo [3/3] Restarting server...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && pm2 restart all && sleep 2 && pm2 logs --lines 5"

echo.
echo ========================================
echo FIX COMPLETE!
echo ========================================
echo.
echo WHAT WAS DONE:
echo 1. Created user_profiles entries for all users without them
echo 2. Verified uploads directory exists
echo 3. Restarted server
echo.
echo TEST NOW:
echo 1. Login to https://insora.in
echo 2. Go to Profile page
echo 3. Your actual name should display (not "Alexander Thompson")
echo 4. Try uploading a profile image
echo 5. Reload page - image should persist
echo.
echo See DATABASE_ANALYSIS_COMPLETE.md for full details
echo.
pause
