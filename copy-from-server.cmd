@echo off
echo === Copying Project from Server ===
echo.

set SSH_KEY=C:\Users\Public\e2c.pem.pem
set SERVER=ubuntu@13.212.38.57
set DESKTOP=%USERPROFILE%\Desktop

echo Creating backup directory...
set BACKUP_DIR=%DESKTOP%\server-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir "%BACKUP_DIR%"

echo.
echo Copying inventoryfullstack project...
echo This may take several minutes...
echo.

scp -i "%SSH_KEY%" -r %SERVER%:~/inventoryfullstack "%BACKUP_DIR%\"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Project copied to:
    echo %BACKUP_DIR%\inventoryfullstack
) else (
    echo.
    echo FAILED to copy project
)

echo.
echo === For Database Copy ===
echo Run these commands manually:
echo.
echo 1. Connect to server:
echo    ssh -i "%SSH_KEY%" %SERVER%
echo.
echo 2. Create database dump on server:
echo    mysqldump -u root -p inventory ^> /tmp/inventory_backup.sql
echo.
echo 3. Exit server (type: exit)
echo.
echo 4. Copy database to Desktop:
echo    scp -i "%SSH_KEY%" %SERVER%:/tmp/inventory_backup.sql "%BACKUP_DIR%\inventory_backup.sql"
echo.
pause
