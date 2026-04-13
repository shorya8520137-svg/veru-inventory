@echo off
echo ========================================
echo   Fixing Conflicts and Deploying
echo ========================================
echo.
echo WARNING: This will discard local changes!
echo Press Ctrl+C to cancel, or
pause

set SSH_KEY=C:\Users\Public\e2c.pem.pem
set SERVER=ubuntu@13.212.52.15

echo.
echo Connecting to server and fixing conflicts...
echo.

ssh -i "%SSH_KEY%" %SERVER% "cd ~/inventoryfullstack && echo 'Aborting any merge...' && git merge --abort 2>/dev/null; git reset --hard HEAD && echo 'Fetching latest...' && git fetch origin main && echo 'Resetting to origin/main...' && git reset --hard origin/main && echo 'Cleaning files...' && git clean -fd && echo 'Installing dependencies...' && npm install && echo 'Building...' && npm run build && echo 'Restarting PM2...' && pm2 restart all && echo 'Done!' && pm2 status"

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
