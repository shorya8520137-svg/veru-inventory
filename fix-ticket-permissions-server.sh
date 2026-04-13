#!/bin/bash

# =====================================================
# TICKET MANAGEMENT PERMISSIONS FIX - SERVER SCRIPT
# =====================================================
# Purpose: Fix admin ticket management tab visibility
# Issue: TICKETS_MANAGE permission missing from database
# Solution: Create permission and assign to super_admin role
# =====================================================

echo "🎫 FIXING TICKET MANAGEMENT PERMISSIONS..."
echo "=============================================="
echo ""

# Database credentials
DB_USER="root"
DB_PASS="StrongPass@123"
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

# Apply the SQL fix
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < /tmp/ticket_permissions_fix.sql

# Check if the command was successful
if [ $? -eq 0 ]; then
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
    echo "🔍 TROUBLESHOOTING:"
    echo "1. Check if MySQL is running: systemctl status mysql"
    echo "2. Verify database credentials"
    echo "3. Ensure database 'inventory_db' exists"
    echo "4. Check MySQL error logs: tail -f /var/log/mysql/error.log"
    echo ""
fi

# Clean up temporary file
rm -f /tmp/ticket_permissions_fix.sql

echo "🧹 Cleanup completed."
echo ""