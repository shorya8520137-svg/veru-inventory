@echo off
echo ========================================
echo Checking and Fixing Routes on Server
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SSH_HOST=ubuntu@13.62.99.152

echo [1/5] Checking if usersRoutes.js exists on server...
ssh -i "%SSH_KEY%" %SSH_HOST% "ls -la ~/veru-inventory/routes/usersRoutes.js"

echo.
echo [2/5] Checking server.js for route registration...
ssh -i "%SSH_KEY%" %SSH_HOST% "grep -n 'api/users' ~/veru-inventory/server.js"

echo.
echo [3/5] Pulling latest code from GitHub...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && git pull origin main"

echo.
echo [4/5] Checking PM2 logs for errors...
ssh -i "%SSH_KEY%" %SSH_HOST% "pm2 logs --lines 20 --nostream"

echo.
echo [5/5] Restarting server...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && pm2 restart all && sleep 3 && pm2 logs --lines 10 --nostream"

echo.
echo ========================================
echo CHECK COMPLETE!
echo ========================================
echo.
echo If usersRoutes.js exists and route is registered,
echo but still getting 404, then check:
echo 1. Is authenticateToken middleware working?
echo 2. Is the JWT token valid?
echo 3. Are there any errors in PM2 logs?
echo.
pause
