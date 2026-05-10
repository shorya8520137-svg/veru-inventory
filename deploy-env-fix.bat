@echo off
echo ========================================
echo Deploying Environment Fix
echo ========================================
echo.
echo PROBLEM: API_BASE was pointing to api.giftgala.in
echo FIX: Changed to insora.in
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SSH_HOST=ubuntu@13.62.99.152

echo [1/4] Uploading fixed .env.production...
scp -i "%SSH_KEY%" .env.production %SSH_HOST%:~/veru-inventory/.env.production

echo.
echo [2/4] Rebuilding Next.js app...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && npm run build"

echo.
echo [3/4] Restarting PM2...
ssh -i "%SSH_KEY%" %SSH_HOST% "cd ~/veru-inventory && pm2 restart all"

echo.
echo [4/4] Checking logs...
ssh -i "%SSH_KEY%" %SSH_HOST% "pm2 logs --lines 10"

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo CHANGES MADE:
echo 1. NEXT_PUBLIC_API_BASE changed from api.giftgala.in to insora.in
echo 2. DB_HOST changed from api.giftgala.in to 127.0.0.1
echo 3. Next.js app rebuilt
echo 4. Server restarted
echo.
echo TEST NOW:
echo 1. Clear browser cache (Ctrl+Shift+Delete)
echo 2. Go to https://insora.in
echo 3. Login
echo 4. Go to Profile page
echo 5. Your name should show correctly now!
echo.
pause
