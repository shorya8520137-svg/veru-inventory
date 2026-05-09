#!/bin/bash

# =====================================================
# AUDIT SYSTEM SETUP SCRIPT
# =====================================================
# This script sets up the enhanced audit logging system
# =====================================================

echo "🚀 Starting Audit System Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if database credentials are set
echo "📋 Step 1: Checking database configuration..."
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅ Found .env.production${NC}"
    source .env.production
else
    echo -e "${RED}❌ .env.production not found${NC}"
    echo "Please create .env.production with database credentials"
    exit 1
fi

# Step 2: Run database migration
echo ""
echo "📋 Step 2: Running database migration..."
echo "This will create 4 new tables and enhance the audit_logs table"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database-migrations/001-enhanced-audit-system.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database migration completed successfully${NC}"
    else
        echo -e "${RED}❌ Database migration failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Skipped database migration${NC}"
fi

# Step 3: Verify tables were created
echo ""
echo "📋 Step 3: Verifying database tables..."
TABLES=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'audit%'" -s)

if [[ $TABLES == *"audit_logs"* ]] && [[ $TABLES == *"audit_log_stats"* ]] && [[ $TABLES == *"audit_log_alerts"* ]]; then
    echo -e "${GREEN}✅ All audit tables exist${NC}"
else
    echo -e "${RED}❌ Some audit tables are missing${NC}"
    exit 1
fi

# Step 4: Check if user_sessions table exists
SESSIONS_TABLE=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'user_sessions'" -s)

if [[ $SESSIONS_TABLE == *"user_sessions"* ]]; then
    echo -e "${GREEN}✅ user_sessions table exists${NC}"
else
    echo -e "${RED}❌ user_sessions table is missing${NC}"
    exit 1
fi

# Step 5: Check if EnhancedAuditLogger.js exists
echo ""
echo "📋 Step 4: Checking EnhancedAuditLogger.js..."
if [ -f "EnhancedAuditLogger.js" ]; then
    echo -e "${GREEN}✅ EnhancedAuditLogger.js found${NC}"
else
    echo -e "${RED}❌ EnhancedAuditLogger.js not found${NC}"
    exit 1
fi

# Step 6: Check if IPGeolocationTracker.js exists
echo ""
echo "📋 Step 5: Checking IPGeolocationTracker.js..."
if [ -f "IPGeolocationTracker.js" ]; then
    echo -e "${GREEN}✅ IPGeolocationTracker.js found${NC}"
else
    echo -e "${YELLOW}⚠️  IPGeolocationTracker.js not found${NC}"
    echo "Creating basic IPGeolocationTracker.js..."
    
    cat > IPGeolocationTracker.js << 'EOF'
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
EOF
    
    echo -e "${GREEN}✅ Created basic IPGeolocationTracker.js${NC}"
fi

# Step 7: Check if admin control routes exist
echo ""
echo "📋 Step 6: Checking admin control routes..."
if [ -f "routes/adminControlRoutes.js" ]; then
    echo -e "${GREEN}✅ adminControlRoutes.js found${NC}"
else
    echo -e "${RED}❌ adminControlRoutes.js not found${NC}"
    exit 1
fi

# Step 8: Summary
echo ""
echo "=========================================="
echo "✅ AUDIT SYSTEM SETUP COMPLETE"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Add admin routes to server.js:"
echo "   const adminControlRoutes = require('./routes/adminControlRoutes');"
echo "   app.use('/api/admin', adminControlRoutes);"
echo ""
echo "2. Restart your server:"
echo "   pm2 restart all"
echo ""
echo "3. Test the audit system:"
echo "   - Login to the application"
echo "   - Check audit_logs table for USER_LOGIN_SUCCESS event"
echo "   - Navigate to /audit-logs in the admin dashboard"
echo ""
echo "4. Start integrating controllers:"
echo "   - See AUDIT_SYSTEM_INTEGRATION_GUIDE.md"
echo "   - Start with permissionsController.js"
echo ""
echo "📚 Documentation:"
echo "   - AUDIT_SYSTEM_INTEGRATION_GUIDE.md"
echo "   - AUDIT_SYSTEM_IMPLEMENTATION_STATUS.md"
echo "   - COMPLETE_AUDIT_SYSTEM_IMPLEMENTATION.md"
echo ""
echo "🎉 Happy auditing!"
echo ""
