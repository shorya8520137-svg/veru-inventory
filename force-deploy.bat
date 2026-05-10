@echo off
echo ========================================
echo FORCE DEPLOY - Complete Redeployment
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SSH_HOST=ubuntu@13.62.99.152

echo [1/7] Stopping PM2...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && pm2 stop all"

echo.
echo [2/7] Backing up current code...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~ && cp -r veru-inventory veru-inventory-backup-$(date +%%Y%%m%%d-%%H%%M%%S)"

echo.
echo [3/7] Resetting git (discarding local changes)...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && git reset --hard HEAD"

echo.
echo [4/7] Pulling latest code from GitHub...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && git pull origin main"

echo.
echo [5/7] Verifying usersRoutes.js exists...
ssh -i "%SSH_KEY%" %SSH_HOST% "ls -lh ~/veru-inventory/routes/usersRoutes.js"

echo.
echo [6/7] Installing dependencies...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && npm install"

echo.
echo [7/7] Starting PM2...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && pm2 start all && sleep 3 && pm2 logs --lines 20 --nostream"

echo.
echo ========================================
echo FORCE DEPLOY COMPLETE!
echo ========================================
echo.
echo Now test:
echo 1. Go to https://api.giftgala.in
echo 2. Login
echo 3. Go to Profile page
echo 4. Check browser console for errors
echo.
pause
