# =====================================================
# AUDIT SYSTEM SETUP SCRIPT (PowerShell)
# =====================================================
# This script sets up the enhanced audit logging system
# =====================================================

Write-Host "🚀 Starting Audit System Setup..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if database credentials are set
Write-Host "📋 Step 1: Checking database configuration..." -ForegroundColor Yellow

if (Test-Path ".env.production") {
    Write-Host "✅ Found .env.production" -ForegroundColor Green
    
    # Load environment variables
    Get-Content .env.production | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "❌ .env.production not found" -ForegroundColor Red
    Write-Host "Please create .env.production with database credentials"
    exit 1
}

$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

# Step 2: Run database migration
Write-Host ""
Write-Host "📋 Step 2: Running database migration..." -ForegroundColor Yellow
Write-Host "This will create 4 new tables and enhance the audit_logs table"

$response = Read-Host "Continue? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    try {
        # Run MySQL migration
        $mysqlCmd = "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME"
        Get-Content "database-migrations/001-enhanced-audit-system.sql" | & mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME
        
        Write-Host "✅ Database migration completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Database migration failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipped database migration" -ForegroundColor Yellow
}

# Step 3: Verify tables were created
Write-Host ""
Write-Host "📋 Step 3: Verifying database tables..." -ForegroundColor Yellow

try {
    $tables = & mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES LIKE 'audit%'" -s
    
    if ($tables -match "audit_logs" -and $tables -match "audit_log_stats" -and $tables -match "audit_log_alerts") {
        Write-Host "✅ All audit tables exist" -ForegroundColor Green
    } else {
        Write-Host "❌ Some audit tables are missing" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "⚠️  Could not verify tables (MySQL might not be in PATH)" -ForegroundColor Yellow
}

# Step 4: Check if user_sessions table exists
try {
    $sessionsTable = & mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES LIKE 'user_sessions'" -s
    
    if ($sessionsTable -match "user_sessions") {
        Write-Host "✅ user_sessions table exists" -ForegroundColor Green
    } else {
        Write-Host "❌ user_sessions table is missing" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "⚠️  Could not verify user_sessions table" -ForegroundColor Yellow
}

# Step 5: Check if EnhancedAuditLogger.js exists
Write-Host ""
Write-Host "📋 Step 4: Checking EnhancedAuditLogger.js..." -ForegroundColor Yellow

if (Test-Path "EnhancedAuditLogger.js") {
    Write-Host "✅ EnhancedAuditLogger.js found" -ForegroundColor Green
} else {
    Write-Host "❌ EnhancedAuditLogger.js not found" -ForegroundColor Red
    exit 1
}

# Step 6: Check if IPGeolocationTracker.js exists
Write-Host ""
Write-Host "📋 Step 5: Checking IPGeolocationTracker.js..." -ForegroundColor Yellow

if (Test-Path "IPGeolocationTracker.js") {
    Write-Host "✅ IPGeolocationTracker.js found" -ForegroundColor Green
} else {
    Write-Host "⚠️  IPGeolocationTracker.js not found" -ForegroundColor Yellow
    Write-Host "Creating basic IPGeolocationTracker.js..."
    
    $trackerContent = @"
/**
 * IP GEOLOCATION TRACKER
 * Basic implementation for tracking IP geolocation
 */

class IPGeolocationTracker {
    async getLocationData(ip) {
        // Basic implementation - returns default values
        // In production, integrate with a geolocation API service
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            coordinates: null,
            timezone: 'UTC',
            isp: 'Unknown'
        };
    }
}

module.exports = IPGeolocationTracker;
"@
    
    Set-Content -Path "IPGeolocationTracker.js" -Value $trackerContent
    Write-Host "✅ Created basic IPGeolocationTracker.js" -ForegroundColor Green
}

# Step 7: Check if admin control routes exist
Write-Host ""
Write-Host "📋 Step 6: Checking admin control routes..." -ForegroundColor Yellow

if (Test-Path "routes/adminControlRoutes.js") {
    Write-Host "✅ adminControlRoutes.js found" -ForegroundColor Green
} else {
    Write-Host "❌ adminControlRoutes.js not found" -ForegroundColor Red
    exit 1
}

# Step 8: Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ AUDIT SYSTEM SETUP COMPLETE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Add admin routes to server.js:"
Write-Host "   const adminControlRoutes = require('./routes/adminControlRoutes');"
Write-Host "   app.use('/api/admin', adminControlRoutes);"
Write-Host ""
Write-Host "2. Restart your server:"
Write-Host "   pm2 restart all"
Write-Host ""
Write-Host "3. Test the audit system:"
Write-Host "   - Login to the application"
Write-Host "   - Check audit_logs table for USER_LOGIN_SUCCESS event"
Write-Host "   - Navigate to /audit-logs in the admin dashboard"
Write-Host ""
Write-Host "4. Start integrating controllers:"
Write-Host "   - See AUDIT_SYSTEM_INTEGRATION_GUIDE.md"
Write-Host "   - Start with permissionsController.js"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - AUDIT_SYSTEM_INTEGRATION_GUIDE.md"
Write-Host "   - AUDIT_SYSTEM_IMPLEMENTATION_STATUS.md"
Write-Host "   - COMPLETE_AUDIT_SYSTEM_IMPLEMENTATION.md"
Write-Host ""
Write-Host "🎉 Happy auditing!" -ForegroundColor Green
Write-Host ""
