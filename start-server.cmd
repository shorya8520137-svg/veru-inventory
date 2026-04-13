@echo off
echo 🚀 Starting Inventory Fullstack Server
echo =====================================

REM Get the directory where this script is located
cd /d "%~dp0"

echo 📍 Working directory: %CD%

REM Check if we're in the right directory
if not exist "server.js" (
    echo ❌ Error: server.js not found in current directory
    echo    Make sure you're running this script from the project root
    pause
    exit /b 1
)

REM Pull latest changes
echo 📥 Pulling latest changes...
git pull origin main

REM Check if emergency fix is needed
if exist "emergency-fix-api-key.js" (
    echo 🔧 Running emergency API key fix...
    node emergency-fix-api-key.js
)

REM Start the server
echo 🚀 Starting server...
echo    Server will be available at: http://localhost:3001
echo    API endpoint: https://54.169.31.95:8443/api/website/orders
echo    Press Ctrl+C to stop
echo.

node server.js