@echo off
REM ============================================
REM Download Complete Database (Structure + Data)
REM ============================================

echo ========================================
echo Complete Database Download
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SSH_HOST=ubuntu@13.62.99.152
set DB_NAME=inventory_db
set OUTPUT_DIR=database-backup
set TIMESTAMP=%date:~-4,4%-%date:~-7,2%-%date:~-10,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set DUMP_FILE=complete_database_%TIMESTAMP%.sql
set LOCAL_FILE=%OUTPUT_DIR%\%DUMP_FILE%

REM Create output directory
if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%

echo Database: %DB_NAME%
echo Output: %LOCAL_FILE%
echo.
echo WARNING: This will download ALL data from the database.
echo The file may be large (several MB).
echo.
set /p CONFIRM=Continue? (yes/no): 
if not "%CONFIRM%"=="yes" (
    echo Download cancelled.
    exit /b 0
)

echo.
echo [1/3] Creating database dump on server...
echo This may take a few minutes...
echo.

REM Create dump on server
ssh -i "%SSH_KEY%" %SSH_HOST% "sudo mysqldump --single-transaction --routines --triggers --events %DB_NAME% > /tmp/%DUMP_FILE% && echo 'Dump created successfully'"

echo.
echo [2/3] Downloading database dump...
echo Transferring file from server...
echo.

REM Download the dump file using SCP
scp -i "%SSH_KEY%" %SSH_HOST%:/tmp/%DUMP_FILE% %LOCAL_FILE%

if exist %LOCAL_FILE% (
    echo [OK] File downloaded successfully!
    for %%A in (%LOCAL_FILE%) do echo File size: %%~zA bytes
) else (
    echo [ERROR] Download failed!
    exit /b 1
)

echo.
echo [3/3] Cleaning up server...
ssh -i "%SSH_KEY%" %SSH_HOST% "rm -f /tmp/%DUMP_FILE% && echo 'Cleanup complete'"

echo.
echo ========================================
echo Download Complete!
echo ========================================
echo.
echo FILE LOCATION: %LOCAL_FILE%
echo.
echo WHAT YOU CAN DO NOW:
echo 1. Open the SQL file in a text editor
echo 2. Search for "CREATE TABLE `users`" to see users table structure
echo 3. Search for "CREATE TABLE `user_profiles`" to see profiles table
echo 4. Search for "INSERT INTO `users`" to see actual user data
echo 5. Import to local MySQL if needed
echo.
echo Opening file in notepad...
start notepad.exe %LOCAL_FILE%
echo.
pause
