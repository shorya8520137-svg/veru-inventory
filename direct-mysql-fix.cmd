@echo off
echo ========================================
echo DIRECT MYSQL NOTIFICATION FIX
echo ========================================
echo.
echo This will execute MySQL commands directly
echo.

echo Uploading SQL file...
scp -i "C:\Users\Admin\e2c.pem" fix-notification-tables-safe.sql ubuntu@54.169.107.64:~/

echo.
echo Executing database fix...
ssh -i "C:\Users\Admin\e2c.pem" ubuntu@54.169.107.64 sudo mysql inventory_db ^< fix-notification-tables-safe.sql

echo.
echo Checking results...
ssh -i "C:\Users\Admin\e2c.pem" ubuntu@54.169.107.64 sudo mysql -e "USE inventory_db; SHOW TABLES;" ^| findstr notification

echo.
echo Done!
pause