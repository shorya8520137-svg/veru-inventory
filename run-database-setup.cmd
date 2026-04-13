@echo off
echo 🔧 Setting up Website Orders Database...
echo.

REM Run the database setup using MySQL
mysql -u root -p inventory_db < setup-website-orders-database-complete.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ Website Orders Database Setup Complete!
    echo.
    echo 📋 Created Tables:
    echo    - website_orders
    echo    - website_order_items  
    echo    - website_order_status_history
    echo    - website_order_inventory_sync
    echo.
    echo 👤 Test User Created:
    echo    Username: ordertest
    echo    Password: testpass123
    echo.
    echo 🛍️ Sample Products Created for Testing
    echo 📦 Sample Order Created for Testing
    echo.
    echo 🎉 Ready to test Website Orders API!
) else (
    echo.
    echo ❌ Database setup failed
    echo 💡 Make sure MySQL is running and you have the correct credentials
    echo 💡 Try: mysql -u root -p
)

pause