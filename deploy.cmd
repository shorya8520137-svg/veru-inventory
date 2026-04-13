@echo off
echo ========================================
echo   Deploying to Production Server
echo ========================================
echo.

set SSH_KEY=C:\Users\Public\e2c.pem.pem
set SERVER=ubuntu@13.212.52.15

echo Connecting to server...
echo.

ssh -i "%SSH_KEY%" %SERVER% "cd ~/inventoryfullstack && git config pull.rebase false && git fetch origin main && git pull origin main && npm install && npm run build && pm2 restart all && pm2 status"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Deployment Successful!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   Deployment Failed!
    echo ========================================
)

pause
