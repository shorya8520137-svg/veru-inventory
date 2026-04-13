@echo off
REM Fix bulk upload source_type column error
REM Run this to fix the database schema

echo ==========================================
echo Fixing stock_batches.source_type column
echo ==========================================

REM Database credentials (update if needed)
set DB_HOST=localhost
set DB_USER=root
set DB_NAME=inventory_db

echo.
echo Executing SQL fix...
mysql -h %DB_HOST% -u %DB_USER% -p %DB_NAME% < fix-bulk-upload-source-type.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: source_type column fixed!
    echo.
    echo Verifying the fix...
    mysql -h %DB_HOST% -u %DB_USER% -p %DB_NAME% -e "DESCRIBE stock_batches;" | findstr source_type
    echo.
    echo ==========================================
    echo Fix complete! Test bulk upload now.
    echo ==========================================
) else (
    echo.
    echo ERROR: Failed to execute SQL fix
    echo Please check the error messages above
    exit /b 1
)
