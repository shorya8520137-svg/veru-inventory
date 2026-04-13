@echo off
echo ========================================
echo DIRECT NOTIFICATION DATABASE FIX
echo ========================================
echo.
echo This will directly execute database commands
echo.

ssh -i "C:\Users\Admin\e2c.pem" ubuntu@54.169.107.64 "sudo mysql inventory_db < fix-notification-tables-safe.sql && echo 'Database fix completed!' && sudo mysql -e 'USE inventory_db; SHOW TABLES;' | grep notification && sudo mysql -e 'USE inventory_db; DESCRIBE notifications;'"

echo.
echo Done!
pause