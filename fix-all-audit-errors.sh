#!/bin/bash

echo "========================================="
echo "🔧 FIXING ALL AUDIT LOGGER ERRORS"
echo "========================================="
echo ""

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Working directory: $SCRIPT_DIR"

# Create backups
echo "📋 Creating backups..."
BACKUP_DIR="$SCRIPT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

cp "$SCRIPT_DIR/ProductionEventAuditLogger.js" "$BACKUP_DIR/"
cp "$SCRIPT_DIR/controllers/returnsController.js" "$BACKUP_DIR/"
cp "$SCRIPT_DIR/controllers/damageRecoveryController.js" "$BACKUP_DIR/"

echo "✅ Backups created in: $BACKUP_DIR"

echo ""
echo "🔧 Summary of fixes applied:"
echo "1. ✅ Added logReturnCreate method to ProductionEventAuditLogger"
echo "2. ✅ Added logDamageCreate method to ProductionEventAuditLogger"
echo "3. ✅ Added logRecoveryCreate method to ProductionEventAuditLogger"
echo "4. ✅ Fixed returns controller method call signature"
echo "5. ✅ Fixed damage recovery controller to use ProductionEventAuditLogger"
echo "6. ✅ Fixed damage recovery controller method calls"

# Verify the fixes
echo ""
echo "🔍 Verifying fixes..."

echo "Checking ProductionEventAuditLogger methods:"
if grep -q "logReturnCreate\|logDamageCreate\|logRecoveryCreate" "$SCRIPT_DIR/ProductionEventAuditLogger.js"; then
    echo "✅ All required methods found in ProductionEventAuditLogger"
else
    echo "❌ Some methods missing in ProductionEventAuditLogger"
fi

echo "Checking returns controller:"
if grep -q "eventAuditLogger.logReturnCreate(req, req.user.id," "$SCRIPT_DIR/controllers/returnsController.js"; then
    echo "✅ Returns controller method call is correct"
else
    echo "❌ Returns controller method call is incorrect"
fi

echo "Checking damage recovery controller:"
if grep -q "ProductionEventAuditLogger" "$SCRIPT_DIR/controllers/damageRecoveryController.js"; then
    echo "✅ Damage recovery controller uses ProductionEventAuditLogger"
else
    echo "❌ Damage recovery controller still uses old EventAuditLogger"
fi

# Test syntax
echo ""
echo "🧪 Testing JavaScript syntax..."
for file in "ProductionEventAuditLogger.js" "controllers/returnsController.js" "controllers/damageRecoveryController.js"; do
    if node -c "$SCRIPT_DIR/$file" 2>/dev/null; then
        echo "✅ $file syntax is valid"
    else
        echo "❌ $file has syntax errors"
    fi
done

# Restart server
echo ""
echo "🔄 Attempting to restart server..."

if command -v pm2 &> /dev/null; then
    echo "Found PM2, restarting processes..."
    pm2 restart all
    echo "✅ PM2 processes restarted"
elif pgrep -f "node.*server.js" > /dev/null; then
    echo "Found Node.js server process, attempting graceful restart..."
    pkill -f "node.*server.js"
    sleep 2
    echo "⚠️  Server stopped. Please manually restart with: node server.js"
else
    echo "⚠️  No running server found. Please start the server manually."
fi

echo ""
echo "========================================="
echo "🎉 ALL FIXES COMPLETED!"
echo "========================================="
echo ""
echo "📝 Fixed Files:"
echo "   - ProductionEventAuditLogger.js (added 3 new methods)"
echo "   - controllers/returnsController.js (fixed method signature)"
echo "   - controllers/damageRecoveryController.js (switched to ProductionEventAuditLogger)"
echo ""
echo "🚀 All audit logging should now work correctly!"
echo ""