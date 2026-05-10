@echo off
REM ============================================
REM Download Complete Database - Auto Mode
REM ============================================

echo ========================================
echo Complete Database Download - AUTO MODE
echo ========================================
echo.

set SSH_KEY=C:\Users\singh\.ssh\insora.pem
set SSH_HOST=ubuntu@13.62.99.152
set DB_NAME=inventory_db
set OUTPUT_DIR=database-backup
set DUMP_FILE=complete_database.sql
set LOCAL_FILE=%OUTPUT_DIR%\%DUMP_FILE%

REM Create output directory
if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%

echo Database: %DB_NAME%
echo Output: %LOCAL_FILE%
echo.

echo [1/3] Creating database dump on server...
ssh -i "%SSH_KEY%" %SSH_HOST% "sudo mysqldump --single-transaction --routines --triggers --events %DB_NAME% > /tmp/%DUMP_FILE% 2>&1 && echo 'Dump created'"

echo.
echo [2/3] Downloading database dump...
scp -i "%SSH_KEY%" %SSH_HOST%:/tmp/%DUMP_FILE% %LOCAL_FILE%

if exist %LOCAL_FILE% (
    echo.
    echo [OK] File downloaded successfully!
    for %%A in (%LOCAL_FILE%) do (
        set size=%%~zA
        set /a sizeMB=%%~zA/1024/1024
    )
    echo File size: %sizeMB% MB
) else (
    echo.
    echo [ERROR] Download failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Cleaning up server...
ssh -i "%SSH_KEY%" %SSH_HOST% "rm -f /tmp/%DUMP_FILE%"

echo.
echo ========================================
echo Download Complete!
echo ========================================
echo.
echo FILE: %LOCAL_FILE%
echo.
echo Opening in notepad...
start notepad.exe %LOCAL_FILE%
echo.
echo Press any key to exit...
pause >nul
