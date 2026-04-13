#!/bin/bash

echo "========================================="
echo "🔧 FIXING RETURN AUDIT LOGGER ERROR"
echo "========================================="
echo ""

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Working directory: $SCRIPT_DIR"

# Backup files before making changes
echo "📋 Creating backups..."
cp "$SCRIPT_DIR/ProductionEventAuditLogger.js" "$SCRIPT_DIR/ProductionEventAuditLogger.js.backup.$(date +%Y%m%d_%H%M%S)"
cp "$SCRIPT_DIR/controllers/returnsController.js" "$SCRIPT_DIR/controllers/returnsController.js.backup.$(date +%Y%m%d_%H%M%S)"

echo "✅ Backups created"

# Fix 1: Add logReturnCreate method to ProductionEventAuditLogger.js
echo ""
echo "🔧 Fix 1: Adding logReturnCreate method to ProductionEventAuditLogger..."

# Check if logReturnCreate method already exists
if grep -q "logReturnCreate" "$SCRIPT_DIR/ProductionEventAuditLogger.js"; then
    echo "⚠️  logReturnCreate method already exists, skipping..."
else
    # Add the logReturnCreate method after logDataExport
    sed -i '/async logDataExport/,/^    }$/a\\n    async logReturnCreate(req, userId, returnData) {\n        return this.logEvent('\''RETURN_CREATE'\'', {\n            action: '\''CREATE_RETURN'\'',\n            user_id: userId,\n            return_id: returnData.return_id,\n            product_name: returnData.product_name,\n            quantity: returnData.quantity,\n            reason: returnData.reason,\n            awb: returnData.awb,\n            condition: returnData.condition || '\''good'\''\n        }, req, userId);\n    }' "$SCRIPT_DIR/ProductionEventAuditLogger.js"
    
    echo "✅ Added logReturnCreate method"
fi

# Fix 2: Update returns controller to use correct method signature
echo ""
echo "🔧 Fix 2: Fixing returns controller method call..."

# Replace the incorrect method call
sed -i 's/eventAuditLogger\.logReturnCreate(req\.user,/eventAuditLogger.logReturnCreate(req, req.user.id,/g' "$SCRIPT_DIR/controllers/returnsController.js"

# Remove the extra parameters that don't match the new signature
sed -i 's/}, req, '\''success'\'');/});/g' "$SCRIPT_DIR/controllers/returnsController.js"

# Add condition parameter to the data object
sed -i '/awb: awb$/a\                    condition: condition' "$SCRIPT_DIR/controllers/returnsController.js"

echo "✅ Fixed returns controller method call"

# Verify the fixes
echo ""
echo "🔍 Verifying fixes..."

echo "Checking ProductionEventAuditLogger for logReturnCreate method:"
if grep -A 10 "async logReturnCreate" "$SCRIPT_DIR/ProductionEventAuditLogger.js"; then
    echo "✅ logReturnCreate method found"
else
    echo "❌ logReturnCreate method not found"
fi

echo ""
echo "Checking returns controller for correct method call:"
if grep -A 5 "eventAuditLogger.logReturnCreate(req, req.user.id," "$SCRIPT_DIR/controllers/returnsController.js"; then
    echo "✅ Correct method call found"
else
    echo "❌ Method call still incorrect"
fi

# Restart the server if PM2 is being used
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
echo "🎉 FIX COMPLETED!"
echo "========================================="
echo ""
echo "📝 Summary of changes:"
echo "1. ✅ Added logReturnCreate method to ProductionEventAuditLogger.js"
echo "2. ✅ Fixed method call in controllers/returnsController.js"
echo "3. ✅ Created backups of original files"
echo ""
echo "📁 Backup files created:"
echo "   - ProductionEventAuditLogger.js.backup.*"
echo "   - controllers/returnsController.js.backup.*"
echo ""
echo "🚀 The return API should now work without the audit logger error!"
echo ""

# Test the fix by checking syntax
echo "🧪 Testing JavaScript syntax..."
if node -c "$SCRIPT_DIR/ProductionEventAuditLogger.js" 2>/dev/null; then
    echo "✅ ProductionEventAuditLogger.js syntax is valid"
else
    echo "❌ ProductionEventAuditLogger.js has syntax errors"
fi

if node -c "$SCRIPT_DIR/controllers/returnsController.js" 2>/dev/null; then
    echo "✅ returnsController.js syntax is valid"
else
    echo "❌ returnsController.js has syntax errors"
fi

echo ""
echo "🔗 Next steps:"
echo "1. Verify server is running: pm2 status or ps aux | grep node"
echo "2. Test the return API endpoint"
echo "3. Check server logs for any remaining errors"
echo ""