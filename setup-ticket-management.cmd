@echo off
echo Setting up Ticket Management System...

echo.
echo 1. Setting up database tables...
mysql -h 127.0.0.1 -P 3306 -u inventory_user -p inventory_db < ticket-management-schema.sql

if %errorlevel% neq 0 (
    echo Error: Failed to setup database tables
    pause
    exit /b 1
)

echo.
echo 2. Restarting server to load new routes...
echo Please restart your Node.js server manually

echo.
echo ✅ Ticket Management System setup complete!
echo.
echo Next steps:
echo 1. Restart your Node.js server (npm run dev or node server.js)
echo 2. Navigate to /tickets in your application
echo 3. Start creating and managing tickets!
echo.
pause