@echo off
echo ========================================
echo   Clean Deploy to Production Server
echo ========================================
echo.
echo This will:
echo - Reset to GitHub version
echo - Clean install dependencies
echo - Rebuild and restart
echo.
echo Press Ctrl+C to cancel, or
pause

set SSH_KEY=C:\Users\Public\e2c.pem.pem
set SERVER=ubuntu@13.212.52.15

echo.
echo Connecting to server...
echo.

ssh -i "%SSH_KEY%" %SERVER% "cd ~/inventoryfullstack && echo '==> Aborting any merge...' && git merge --abort 2>/dev/null; echo '==> Resetting to HEAD...' && git reset --hard HEAD && echo '==> Fetching latest from GitHub...' && git fetch origin main && echo '==> Resetting to origin/main...' && git reset --hard origin/main && echo '==> Cleaning untracked files...' && git clean -fd && echo '==> Removing node_modules...' && rm -rf node_modules && rm -rf .next && echo '==> Installing dependencies (this may take a while)...' && npm install --legacy-peer-deps && echo '==> Building application...' && npm run build && echo '==> Restarting PM2...' && pm2 restart all && echo '==> Deployment complete!' && pm2 list"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ Deployment Successful!
    echo ========================================
    echo.
    echo Your application is now updated!
) else (
    echo.
    echo ========================================
    echo   ❌ Deployment Failed!
    echo ========================================
    echo.
    echo Check the error messages above.
)

pause
