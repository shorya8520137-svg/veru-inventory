@echo off
echo ========================================
echo   DEPLOY UPDATED FILES TO SERVER
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SERVER=ubuntu@13.62.99.152

echo Finding your project directory on server...
ssh -i "%SSH_KEY%" %SERVER% "find /var/www /opt /home -name 'server.js' -type f 2>/dev/null | grep -v node_modules | head -1"
echo.

echo Please tell me the path where your project is located on the server.
echo Example: /var/www/inventory-veru
echo.
set /p PROJECT_PATH="Enter project path: "

echo.
echo Uploading updated files to %PROJECT_PATH%...
echo.

echo 1. Uploading RoleModalNew.jsx...
scp -i "%SSH_KEY%" src/app/permissions/RoleModalNew.jsx %SERVER%:%PROJECT_PATH%/src/app/permissions/

echo 2. Uploading page.jsx...
scp -i "%SSH_KEY%" src/app/permissions/page.jsx %SERVER%:%PROJECT_PATH%/src/app/permissions/

echo 3. Uploading permissions.module.css...
scp -i "%SSH_KEY%" src/app/permissions/permissions.module.css %SERVER%:%PROJECT_PATH%/src/app/permissions/

echo 4. Uploading api.js...
scp -i "%SSH_KEY%" src/utils/api.js %SERVER%:%PROJECT_PATH%/src/utils/

echo 5. Uploading permissionsRoutes.js...
scp -i "%SSH_KEY%" routes/permissionsRoutes.js %SERVER%:%PROJECT_PATH%/routes/

echo.
echo ========================================
echo   FILES UPLOADED!
echo ========================================
echo.
echo Now restart your server:
echo   ssh -i "%SSH_KEY%" %SERVER%
echo   cd %PROJECT_PATH%
echo   pm2 restart all
echo.
pause
