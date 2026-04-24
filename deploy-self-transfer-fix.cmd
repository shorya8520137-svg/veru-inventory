@echo off
echo ========================================
echo DEPLOYING SELF-TRANSFER MODAL FIX
echo ========================================

echo.
echo 1. Uploading updated selfTransferRoutes.js...
scp -i "C:\Users\singh\.ssh\pem.pem" routes/selfTransferRoutes.js ubuntu@54.254.254.75:/home/ubuntu/inventoryfullstack/routes/

echo.
echo 2. Uploading updated ProductTracker.jsx...
scp -i "C:\Users\singh\.ssh\pem.pem" src/app/inventory/ProductTracker.jsx ubuntu@54.254.254.75:/home/ubuntu/inventoryfullstack/src/app/inventory/

echo.
echo 3. Restarting server...
ssh -i "C:\Users\singh\.ssh\pem.pem" ubuntu@54.254.254.75 "cd /home/ubuntu/inventoryfullstack && pm2 restart all"

echo.
echo 4. Testing self-transfer details API...
timeout /t 3 /nobreak > nul
node test-self-transfer-details.js

echo.
echo ========================================
echo DEPLOYMENT COMPLETE
echo ========================================
pause