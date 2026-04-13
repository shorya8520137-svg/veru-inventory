@echo off
echo 🌐 Pushing CORS fix to GitHub...

cd /d "%~dp0"

echo.
echo Adding changes...
git add server.js
git add test-cors-fix.js
git add push-cors-fix.cmd

echo.
echo Committing changes...
git commit -m "Fix: CORS configuration for frontend integration

- Added explicit preflight OPTIONS handling
- Added preflightContinue: false and optionsSuccessStatus: 204
- Duplicated API website routes at /api/website for frontend compatibility
- Disabled conflicting JWT-based website routes
- Frontend can now access https://54.169.31.95:8443/api/website/orders
- Added comprehensive CORS test script"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ✅ CORS fix pushed to GitHub!
echo.
echo Next steps:
echo 1. Pull changes: git pull origin main
echo 2. Restart server: node server.js
echo 3. Test CORS: node test-cors-fix.js
echo 4. Update frontend to use: https://54.169.31.95:8443/api/website/orders
echo 5. Add header: X-API-Key: wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37
echo.
pause