@echo off
echo 🚀 Pushing startup scripts to GitHub...

cd /d "%~dp0"

echo.
echo Adding changes...
git add start-server.sh
git add start-server.cmd
git add SIMPLE_SERVER_STARTUP_GUIDE.md
git add push-startup-scripts.cmd

echo.
echo Committing changes...
git commit -m "Add: Simple server startup scripts

- Added start-server.sh for Linux/Mac
- Added start-server.cmd for Windows  
- Scripts automatically handle directory navigation
- Auto-pull latest changes and run emergency fixes
- No more 'cd' confusion or wrong directory errors
- One-command solution for server startup
- Added comprehensive startup guide"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ✅ Startup scripts pushed to GitHub!
echo.
echo 🎯 SIMPLE SOLUTION FOR USER:
echo.
echo Linux/Mac users run:
echo   chmod +x /home/ubuntu/inventoryfullstack/start-server.sh
echo   /home/ubuntu/inventoryfullstack/start-server.sh
echo.
echo Windows users run:
echo   C:\path\to\inventoryfullstack\start-server.cmd
echo.
echo No more directory issues! 🎉
echo.
pause