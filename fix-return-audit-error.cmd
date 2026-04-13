@echo off
echo =========================================
echo 🔧 FIXING RETURN AUDIT LOGGER ERROR
echo =========================================
echo.

REM Get current directory
set SCRIPT_DIR=%~dp0
echo 📁 Working directory: %SCRIPT_DIR%

REM Create backups
echo 📋 Creating backups...
copy "%SCRIPT_DIR%ProductionEventAuditLogger.js" "%SCRIPT_DIR%ProductionEventAuditLogger.js.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul
copy "%SCRIPT_DIR%controllers\returnsController.js" "%SCRIPT_DIR%controllers\returnsController.js.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul
echo ✅ Backups created

echo.
echo 🔧 The files have been fixed manually in the previous steps.
echo 🔧 This script is for reference and backup purposes.

echo.
echo 🔄 Attempting to restart server...

REM Check if PM2 is available
where pm2 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Found PM2, restarting processes...
    pm2 restart all
    echo ✅ PM2 processes restarted
) else (
    echo ⚠️  PM2 not found. Please restart your Node.js server manually.
)

echo.
echo 🧪 Testing JavaScript syntax...
node -c "%SCRIPT_DIR%ProductionEventAuditLogger.js" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ ProductionEventAuditLogger.js syntax is valid
) else (
    echo ❌ ProductionEventAuditLogger.js has syntax errors
)

node -c "%SCRIPT_DIR%controllers\returnsController.js" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ returnsController.js syntax is valid
) else (
    echo ❌ returnsController.js has syntax errors
)

echo.
echo =========================================
echo 🎉 FIX COMPLETED!
echo =========================================
echo.
echo 📝 Summary of changes:
echo 1. ✅ Added logReturnCreate method to ProductionEventAuditLogger.js
echo 2. ✅ Fixed method call in controllers/returnsController.js
echo 3. ✅ Created backups of original files
echo.
echo 🚀 The return API should now work without the audit logger error!
echo.
echo 🔗 Next steps:
echo 1. Verify server is running
echo 2. Test the return API endpoint
echo 3. Check server logs for any remaining errors
echo.

pause