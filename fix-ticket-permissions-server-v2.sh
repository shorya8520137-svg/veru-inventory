#!/bin/bash

# =====================================================
# TICKET MANAGEMENT PERMISSIONS FIX - SERVER SCRIPT V2
# =====================================================
# Purpose: Fix admin ticket management tab visibility
# Issue: TICKETS_MANAGE permission missing from database
# Solution: Create permission and assign to super_admin role
# Fixed: Ubuntu MySQL authentication issue
# =====================================================

echo "🎫 FIXING TICKET MANAGEMENT PERMISSIONS (V2)..."
echo "================================================"
echo ""

# Database credentials
DB_NAME="inventory_db"

echo "📋 Creating SQL fix..."

# Create temporary SQL file
cat > /tmp/ticket_permissions_fix.sql << 'EOF'
-- =====================================================
-- TICKET MANAGEMENT PERMISSIONS FIX
-- =====================================================

-- 1. Create missing ticket permissions
INSERT IGNORE INTO permissions (name, description, category, is_active, created_at) 
VALUES 
    ('TICKETS_MANAGE', 'Manage tickets and ticket system', 'Tickets', 1, NOW()),
    ('TICKETS_VIEW', 'View tickets', 'Tickets', 1, NOW()),
    ('TICKETS_CREATE', 'Create new tickets', 'Tickets', 1, NOW()),
    ('TICKETS_EDIT', 'Edit existing tickets', 'Tickets', 1, NOW());

-- 2. Get permission IDs
SET @tickets_manage_id = (SELECT id FROM permissions WHERE name = 'TICKETS_MANAGE');
SET @tickets_view_id = (SELECT id FROM permissions WHERE name = 'TICKETS_VIEW');
SET @tickets_create_id = (SELECT id FROM permissions WHERE name = 'TICKETS_CREATE');
SET @tickets_edit_id = (SELECT id FROM permissions WHERE name = 'TICKETS_EDIT');

-- 3. Assign all ticket permissions to super_admin role (ID: 1)
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
VALUES 
    (1, @tickets_manage_id, NOW()),
    (1, @tickets_view_id, NOW()),
    (1, @tickets_create_id, NOW()),
    (1, @tickets_edit_id, NOW());

-- 4. Verification queries
SELECT '✅ CREATED PERMISSIONS:' as status;
SELECT id, name, description, category FROM permissions WHERE name LIKE 'TICKETS_%' ORDER BY name;

SELECT '✅ ASSIGNED TO SUPER_ADMIN:' as status;
SELECT r.name as role_name, p.name as permission_name, p.description
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name LIKE 'TICKETS_%' AND r.id = 1
ORDER BY p.name;

SELECT '✅ SUPER_ADMIN USERS WHO WILL GET ACCESS:' as status;
SELECT u.id, u.name, u.email, r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.id = 1 AND u.is_active = 1
ORDER BY u.name;
EOF

echo "🔧 Applying database fix..."
echo "Trying different MySQL authentication methods..."

# Method 1: Try with sudo (auth_socket)
echo "Method 1: Using sudo mysql (auth_socket)..."
if sudo mysql "$DB_NAME" < /tmp/ticket_permissions_fix.sql 2>/dev/null; then
    echo "✅ SUCCESS: Fix applied using sudo mysql!"
    SUCCESS=true
else
    echo "❌ Method 1 failed, trying Method 2..."
    
    # Method 2: Try with root password
    echo "Method 2: Using mysql with password..."
    read -s -p "Enter MySQL root password (or press Enter to skip): " MYSQL_PASS
    echo ""
    
    if [ -n "$MYSQL_PASS" ]; then
        if mysql -u root -p"$MYSQL_PASS" "$DB_NAME" < /tmp/ticket_permissions_fix.sql 2>/dev/null; then
            echo "✅ SUCCESS: Fix applied using password authentication!"
            SUCCESS=true
        else
            echo "❌ Method 2 failed, trying Method 3..."
        fi
    else
        echo "❌ No password provided, trying Method 3..."
    fi
    
    # Method 3: Try without password
    if [ "$SUCCESS" != "true" ]; then
        echo "Method 3: Using mysql without password..."
        if mysql -u root "$DB_NAME" < /tmp/ticket_permissions_fix.sql 2>/dev/null; then
            echo "✅ SUCCESS: Fix applied without password!"
            SUCCESS=true
        else
            echo "❌ Method 3 failed, trying Method 4..."
        fi
    fi
    
    # Method 4: Try with inventory_user (from your app)
    if [ "$SUCCESS" != "true" ]; then
        echo "Method 4: Using inventory_user..."
        read -s -p "Enter inventory_user password (default: StrongPass@123): " APP_PASS
        echo ""
        APP_PASS=${APP_PASS:-StrongPass@123}
        
        if mysql -u inventory_user -p"$APP_PASS" "$DB_NAME" < /tmp/ticket_permissions_fix.sql 2>/dev/null; then
            echo "✅ SUCCESS: Fix applied using inventory_user!"
            SUCCESS=true
        else
            echo "❌ All methods failed!"
        fi
    fi
fi

# Check if any method succeeded
if [ "$SUCCESS" = "true" ]; then
    echo ""
    echo "✅ TICKET PERMISSIONS FIX APPLIED SUCCESSFULLY!"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "1. Restart your Node.js server:"
    echo "   pm2 restart all  (if using PM2)"
    echo "   OR"
    echo "   pkill -f node && npm start  (if running directly)"
    echo ""
    echo "2. Clear browser cache and localStorage"
    echo "3. Login as super_admin user"
    echo "4. Check if 'Ticket Management' tab appears in sidebar"
    echo ""
    echo "🎯 EXPECTED RESULT:"
    echo "- Super admin users will now see 'Ticket Management' tab"
    echo "- Tab will link to /tickets page"
    echo "- All users can still access 'Raise Ticket' tab"
    echo ""
else
    echo ""
    echo "❌ DATABASE FIX FAILED!"
    echo ""
    echo "🔍 MANUAL TROUBLESHOOTING:"
    echo "1. Check MySQL status: systemctl status mysql"
    echo "2. Try connecting manually: sudo mysql"
    echo "3. Check if database exists: SHOW DATABASES;"
    echo "4. Run the SQL manually:"
    echo "   sudo mysql $DB_NAME < /tmp/ticket_permissions_fix.sql"
    echo ""
    echo "📞 ALTERNATIVE: Run SQL commands manually in MySQL:"
    echo "   sudo mysql"
    echo "   USE $DB_NAME;"
    echo "   Then copy-paste the SQL from /tmp/ticket_permissions_fix.sql"
    echo ""
fi

# Clean up temporary file
rm -f /tmp/ticket_permissions_fix.sql

echo "🧹 Cleanup completed."
echo ""