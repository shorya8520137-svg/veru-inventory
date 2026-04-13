@echo off
echo 🔧 Pushing API key context fix to GitHub...

cd /d "%~dp0"

echo.
echo Adding changes...
git add controllers/apiKeysController.js
git add test-api-key-context-fix.js
git add push-context-fix.cmd

echo.
echo Committing changes...
git commit -m "Fix: API key validation context binding issue

- Fixed 'Cannot read properties of undefined (reading logApiUsage)' error
- Added 'const self = this' to preserve context in database callbacks
- Replaced 'this.logApiUsage' with 'self.logApiUsage' in callback
- Added test script to verify the fix works
- API key authentication now works without context errors"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ✅ Context fix pushed to GitHub!
echo.
echo Next steps:
echo 1. Pull changes: git pull origin main
echo 2. Restart server: node server.js
echo 3. Test fix: node test-api-key-context-fix.js
echo.
pause