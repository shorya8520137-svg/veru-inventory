@echo off
REM Start Backend Server

echo.
echo ==========================================
echo Starting Backend Server
echo ==========================================
echo.

cd /d "%~dp0"

echo Checking Node.js...
node --version

echo.
echo Starting server...
echo.

npm run server

pause
