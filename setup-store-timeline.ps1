# Setup Store Timeline - Quick Fix Script
# This script will create the store_timeline table and populate it with existing data

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Store Timeline Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env.production") {
    Write-Host "Loading production environment..." -ForegroundColor Yellow
    Get-Content ".env.production" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Get database credentials
$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

if (-not $DB_HOST -or -not $DB_USER -or -not $DB_NAME) {
    Write-Host "❌ Database credentials not found in .env.production" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please provide database credentials:" -ForegroundColor Yellow
    $DB_HOST = Read-Host "Database Host (e.g., localhost)"
    $DB_USER = Read-Host "Database User"
    $DB_PASSWORD = Read-Host "Database Password" -AsSecureString
    $DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
    $DB_NAME = Read-Host "Database Name"
}

Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor Cyan
Write-Host "  User: $DB_USER" -ForegroundColor Cyan
Write-Host "  Database: $DB_NAME" -ForegroundColor Cyan
Write-Host ""

# Check if mysql command is available
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Host "❌ MySQL client not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MySQL client or run the SQL script manually:" -ForegroundColor Yellow
    Write-Host "  mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < setup-store-timeline.sql" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Run the setup script
Write-Host "Running store timeline setup..." -ForegroundColor Yellow
Write-Host ""

try {
    # Create a temporary file with the password
    $tempFile = [System.IO.Path]::GetTempFileName()
    "[client]`npassword=$DB_PASSWORD" | Out-File -FilePath $tempFile -Encoding ASCII
    
    # Run the SQL script
    $result = & mysql --defaults-extra-file=$tempFile -h $DB_HOST -u $DB_USER $DB_NAME -e "source setup-store-timeline.sql" 2>&1
    
    # Remove temp file
    Remove-Item $tempFile -Force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Store timeline setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Restart your application" -ForegroundColor Cyan
        Write-Host "2. Navigate to Store Inventory page" -ForegroundColor Cyan
        Write-Host "3. Timeline should now be visible" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "❌ Setup failed with error:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "Try running manually:" -ForegroundColor Yellow
        Write-Host "  mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < setup-store-timeline.sql" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error running setup:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "  mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < setup-store-timeline.sql" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
