@echo off
echo ========================================
echo   PERMISSIONS SETUP ON SERVER
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SERVER=ubuntu@13.62.99.152
set DB_USER=inventory_user
set DB_PASS=StrongPass@123
set DB_NAME=inventory_db

echo Step 1: Uploading SQL file to server...
scp -i "%SSH_KEY%" complete-permissions-setup.sql %SERVER%:/tmp/
if %errorlevel% neq 0 (
    echo ERROR: Failed to upload SQL file
    pause
    exit /b 1
)
echo SUCCESS: SQL file uploaded
echo.

echo Step 2: Running SQL script on database...
ssh -i "%SSH_KEY%" %SERVER% "mysql -u %DB_USER% -p'%DB_PASS%' %DB_NAME% < /tmp/complete-permissions-setup.sql"
if %errorlevel% neq 0 (
    echo ERROR: Failed to execute SQL script
    pause
    exit /b 1
)
echo SUCCESS: SQL script executed
echo.

echo Step 3: Verifying permissions count...
ssh -i "%SSH_KEY%" %SERVER% "mysql -u %DB_USER% -p'%DB_PASS%' %DB_NAME% -e 'SELECT COUNT(*) as total_permissions FROM permissions WHERE is_active = TRUE;'"
echo.

echo Step 4: Showing permissions breakdown...
ssh -i "%SSH_KEY%" %SERVER% "mysql -u %DB_USER% -p'%DB_PASS%' %DB_NAME% -e 'SELECT feature_section, COUNT(*) as count FROM permissions WHERE is_active = TRUE GROUP BY feature_section ORDER BY feature_section;'"
echo.

echo Step 5: Cleanup...
ssh -i "%SSH_KEY%" %SERVER% "rm /tmp/complete-permissions-setup.sql"
echo.

echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Your permissions system is now ready!
echo.
echo Next steps:
echo 1. Open your frontend at https://api.giftgala.in/permissions
echo 2. Click Create Role or Edit Role
echo 3. You will see the new tab-based UI with warehouse dropdown
echo 4. Select warehouses from the dropdown
echo 5. Assign permissions per warehouse
echo.
echo The frontend is already updated and ready to use!
echo.
pause
