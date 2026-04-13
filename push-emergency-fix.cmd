@echo off
echo 🚨 Pushing emergency API key fix to GitHub...

cd /d "%~dp0"

echo.
echo Adding changes...
git add controllers/apiKeysController.js
git add emergency-fix-api-key.js
git add push-emergency-fix.cmd

echo.
echo Committing changes...
git commit -m "Emergency Fix: Remove problematic logApiUsage call

- Replaced self.logApiUsage() with direct console.log()
- Eliminates 'Cannot read properties of undefined' error completely
- Added emergency fix script for immediate deployment
- Server will no longer crash on API key validation
- Simplified logging approach for better reliability"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ✅ Emergency fix pushed to GitHub!
echo.
echo IMMEDIATE ACTIONS NEEDED:
echo 1. Run emergency fix: node emergency-fix-api-key.js
echo 2. Restart server: node server.js
echo 3. Test API: Your frontend should now work!
echo.
echo Alternative: Pull changes and restart
echo 1. git pull origin main
echo 2. node server.js
echo.
pause