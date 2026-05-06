#!/bin/bash

# ============================================================================
# SETUP PERMISSIONS ON SERVER
# Connects to AWS server and runs the complete permissions setup SQL
# ============================================================================

echo "========================================"
echo "  PERMISSIONS SETUP ON SERVER"
echo "========================================"
echo ""

SSH_KEY="C:/Users/singh/.ssh/insora.pem"
SERVER="ubuntu@13.62.99.152"
DB_USER="inventory_user"
DB_PASS="StrongPass@123"
DB_NAME="inventory_db"
SQL_FILE="complete-permissions-setup.sql"

echo "📋 Configuration:"
echo "   Server: $SERVER"
echo "   Database: $DB_NAME"
echo "   SQL File: $SQL_FILE"
echo ""

# Step 1: Upload SQL file to server
echo "📤 Step 1: Uploading SQL file to server..."
scp -i "$SSH_KEY" "$SQL_FILE" "${SERVER}:/tmp/$SQL_FILE"
if [ $? -eq 0 ]; then
    echo "   ✅ SQL file uploaded successfully"
else
    echo "   ❌ Failed to upload SQL file"
    exit 1
fi
echo ""

# Step 2: Run SQL script on server
echo "🗄️  Step 2: Running SQL script on database..."
echo "   This will:"
echo "   - Create 120+ permissions"
echo "   - Generate dynamic warehouse permissions"
echo "   - Set up auto-sync triggers"
echo ""

ssh -i "$SSH_KEY" "$SERVER" "mysql -u $DB_USER -p'$DB_PASS' $DB_NAME < /tmp/$SQL_FILE"
if [ $? -eq 0 ]; then
    echo "   ✅ SQL script executed successfully"
else
    echo "   ❌ Failed to execute SQL script"
    exit 1
fi
echo ""

# Step 3: Verify permissions count
echo "🔍 Step 3: Verifying permissions setup..."
ssh -i "$SSH_KEY" "$SERVER" "mysql -u $DB_USER -p'$DB_PASS' $DB_NAME -e 'SELECT COUNT(*) as total_permissions FROM permissions WHERE is_active = TRUE;'"
echo "   ✅ Verification complete"
echo ""

# Step 4: Show permissions by category
echo "📊 Step 4: Permissions breakdown by category..."
ssh -i "$SSH_KEY" "$SERVER" "mysql -u $DB_USER -p'$DB_PASS' $DB_NAME -e 'SELECT feature_section, COUNT(*) as count FROM permissions WHERE is_active = TRUE GROUP BY feature_section ORDER BY feature_section;'"
echo "   ✅ Breakdown complete"
echo ""

# Step 5: Cleanup
echo "🧹 Step 5: Cleaning up temporary files..."
ssh -i "$SSH_KEY" "$SERVER" "rm /tmp/$SQL_FILE"
echo "   ✅ Cleanup complete"
echo ""

echo "========================================"
echo "  ✅ SETUP COMPLETE!"
echo "========================================"
echo ""
echo "🎉 Your permissions system is now ready!"
echo ""
echo "Next steps:"
echo "1. Open your frontend at https://yourdomain.com/permissions"
echo "2. Click 'Create Role' or 'Edit Role'"
echo "3. You'll see the new tab-based UI with warehouse dropdown"
echo "4. Select warehouses from the dropdown"
echo "5. Assign permissions per warehouse"
echo ""
echo "🔥 The frontend is already updated and ready to use!"
echo ""
