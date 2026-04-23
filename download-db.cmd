@echo off
REM Database Download Script

setlocal enabledelayedexpansion

set PEM_KEY=C:\Users\Public\pem.pem
set SSH_USER=ubuntu
set SSH_HOST=54.169.102.51
set DB_USER=inventory_user
set DB_PASSWORD=StrongPass@123
set DB_NAME=inventory_db

REM Generate timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set TIMESTAMP=%mydate%_%mytime%
set LOCAL_DUMP_FILE=database_dump_%TIMESTAMP%.sql

echo.
echo ==========================================
echo Database Download Script
echo ==========================================
echo.
echo Downloading database from %SSH_HOST%...
echo.

ssh -i "%PEM_KEY%" %SSH_USER%@%SSH_HOST% "mysqldump -u %DB_USER% -p%DB_PASSWORD% %DB_NAME%" > "%LOCAL_DUMP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Database downloaded successfully to: %LOCAL_DUMP_FILE%
    echo.
    echo Analyzing structure...
    echo.
    
    REM Search for tables
    findstr /C:"CREATE TABLE" "%LOCAL_DUMP_FILE%" > tables_found.txt
    
    echo Tables found:
    type tables_found.txt
    echo.
    
    REM Check for required tables
    echo Checking for Self Transfer tables...
    findstr /C:"CREATE TABLE `inventory_transfers`" "%LOCAL_DUMP_FILE%" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   OK: inventory_transfers EXISTS
    ) else (
        echo   MISSING: inventory_transfers
    )
    
    findstr /C:"CREATE TABLE `transfer_items`" "%LOCAL_DUMP_FILE%" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   OK: transfer_items EXISTS
    ) else (
        echo   MISSING: transfer_items
    )
    
    findstr /C:"CREATE TABLE `timeline_events`" "%LOCAL_DUMP_FILE%" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   OK: timeline_events EXISTS
    ) else (
        echo   MISSING: timeline_events
    )
    
    echo.
    echo Full dump file: %LOCAL_DUMP_FILE%
    echo.
) else (
    echo ERROR: Failed to download database
    echo Check your SSH connection and PEM key
)

pause
