@echo off
echo 🔧 Pushing server fix to GitHub...

cd /d "%~dp0"

echo.
echo Adding changes...
git add controllers/apiKeysController.js
git add test-server-fix-and-api.js
git add push-server-fix.cmd

echo.
echo Committing changes...
git commit -m "Fix: Convert validateApiKey arrow function to regular method

- Fixed Route.get() callback error by converting arrow function to regular method
- Arrow functions don't bind properly when controller is exported as instance
- Added comprehensive API test script for verification
- Ready for server restart and testing"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ✅ Server fix pushed to GitHub!
echo.
echo Next steps:
echo 1. Pull changes: git pull origin main
echo 2. Restart server: node server.js
echo 3. Test API: node test-server-fix-and-api.js
echo.
pause