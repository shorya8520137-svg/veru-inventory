@echo off
echo 🔧 Setting up API Keys database tables...

REM Load database credentials from .env.production
for /f "tokens=1,2 delims==" %%a in (.env.production) do (
    if "%%a"=="DB_HOST" set DB_HOST=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
    if "%%a"=="DB_NAME" set DB_NAME=%%b
)

REM Run the SQL script
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < setup-api-keys-database.sql

if %errorlevel% equ 0 (
    echo ✅ API Keys database tables created successfully!
) else (
    echo ❌ Failed to create API Keys database tables
    exit /b 1
)

echo 🚀 API Keys system is now ready to use!
pause