@echo off
echo Starting Inventory Database Analysis...
echo =====================================

REM Copy SQL file to server and execute
scp -i "C:\Users\Admin\e2c.pem" database-analysis.sql ubuntu@18.143.163.44:/tmp/

REM Execute the analysis
ssh -i "C:\Users\Admin\e2c.pem" ubuntu@18.143.163.44 "sudo mysql -u root inventory_db < /tmp/database-analysis.sql"

echo.
echo Analysis complete!
pause