@echo off
echo ========================================
echo Deploying Profile Page Debug Fix
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SSH_HOST=ubuntu@13.62.99.152

echo [1/4] Pulling latest code from GitHub...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && git pull origin main"

echo.
echo [2/4] Installing dependencies (if any new)...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && npm install"

echo.
echo [3/4] Rebuilding Next.js...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && npm run build"

echo.
echo [4/4] Restarting PM2...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && pm2 restart all && pm2 logs --lines 15"

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo WHAT WAS DEPLOYED:
echo 1. Added console.log debugging to profile page
echo 2. Created test-profile-api.js script for API testing
echo.
echo NEXT STEPS TO DEBUG:
echo.
echo 1. Clear browser cache (Ctrl+Shift+Delete)
echo 2. Go to https://api.giftgala.in
echo 3. Login
echo 4. Open browser console (F12)
echo 5. Go to Profile page
echo 6. Check console logs - you should see:
echo    [Profile] Fetching from: ...
echo    [Profile] API Response: ...
echo    [Profile] Normalized user: ...
echo    [Profile] Form set with: ...
echo.
echo 7. If you see the logs, check what data is in "API Response"
echo 8. If "name" is there but form is empty, there's a frontend issue
echo 9. If "name" is NOT there, there's a backend issue
echo.
echo ALTERNATIVE: Test API directly
echo 1. Get your JWT token from browser console:
echo    localStorage.getItem('token')
echo 2. Run: node test-profile-api.js "YOUR_TOKEN"
echo.
pause
