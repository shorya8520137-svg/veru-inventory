@echo off
echo ========================================
echo   SETUP ADMIN USER
echo ========================================
echo.
echo WARNING: This will DELETE all users except admin@company.com
echo.
set /p CONFIRM="Type YES to continue: "
if /i not "%CONFIRM%"=="YES" (
    echo Operation cancelled.
    pause
    exit /b 0
)
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SERVER=ubuntu@13.62.99.152
set DB_USER=inventory_user
set DB_PASS=StrongPass@123
set DB_NAME=inventory_db

echo Step 1: Uploading SQL file to server...
scp -i "%SSH_KEY%" setup-admin-user.sql %SERVER%:/tmp/
if %errorlevel% neq 0 (
    echo ERROR: Failed to upload SQL file
    pause
    exit /b 1
)
echo SUCCESS: SQL file uploaded
echo.

echo Step 2: Running admin setup script...
ssh -i "%SSH_KEY%" %SERVER% "mysql -u %DB_USER% -p'%DB_PASS%' %DB_NAME% < /tmp/setup-admin-user.sql"
if %errorlevel% neq 0 (
    echo ERROR: Failed to execute SQL script
    pause
    exit /b 1
)
echo SUCCESS: Admin setup complete
echo.

echo Step 3: Cleanup...
ssh -i "%SSH_KEY%" %SERVER% "rm /tmp/setup-admin-user.sql"
echo.

echo ========================================
echo   ADMIN USER READY!
echo ========================================
echo.
echo Login Credentials:
echo   Email: admin@company.com
echo   Password: Admin@123
echo.
echo This user has FULL ACCESS to all 155 permissions!
echo.
pause
