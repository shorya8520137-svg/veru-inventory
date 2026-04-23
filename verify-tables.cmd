@echo off
REM Verify table structures on the server

setlocal enabledelayedexpansion

set PEM_KEY=C:\Users\Public\pem.pem
set SSH_USER=ubuntu
set SSH_HOST=54.169.102.51
set DB_USER=inventory_user
set DB_PASSWORD=StrongPass@123
set DB_NAME=inventory_db

echo.
echo ==========================================
echo Table Structure Verification
echo ==========================================
echo.

echo Checking inventory_transfers table...
ssh -i "%PEM_KEY%" %SSH_USER%@%SSH_HOST% "mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% -e 'DESCRIBE inventory_transfers;'"

echo.
echo Checking transfer_items table...
ssh -i "%PEM_KEY%" %SSH_USER%@%SSH_HOST% "mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% -e 'DESCRIBE transfer_items;'"

echo.
echo Checking timeline_events table...
ssh -i "%PEM_KEY%" %SSH_USER%@%SSH_HOST% "mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% -e 'DESCRIBE timeline_events;'"

echo.
echo ==========================================
echo Verification Complete
echo ==========================================
echo.

pause
