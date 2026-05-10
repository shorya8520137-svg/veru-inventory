@echo off
echo ========================================
echo Deploy and Check PM2 Logs
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SSH_HOST=ubuntu@13.62.99.152

echo [1/3] Pulling latest code...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && git pull origin main"

echo.
echo [2/3] Restarting PM2...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && pm2 restart all"

echo.
echo [3/3] Watching PM2 logs (Press Ctrl+C to stop)...
echo.
echo Now go to browser and:
echo 1. Clear cache (Ctrl+Shift+Delete)
echo 2. Go to https://api.giftgala.in
echo 3. Login
echo 4. Go to Profile page
echo.
echo Watch the logs below - you should see:
echo [Profile API] Fetching profile for user ID: X
echo [Profile API] Query result: ...
echo.
ssh -i "%SSH_KEY%" %SSH_HOST% "pm2 logs --lines 50"
