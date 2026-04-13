#!/bin/bash

# =====================================================
# MANUAL DATABASE SETUP SCRIPT
# =====================================================
# Run this if the automated script fails
# =====================================================

echo "🔧 MANUAL DATABASE SETUP"
echo "========================"
echo ""

echo "This script will help you set up the database manually."
echo "Choose your method:"
echo ""
echo "1. Using sudo mysql (recommended for Ubuntu)"
echo "2. Using mysql with password"
echo "3. Skip database setup"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Using sudo mysql..."
        sudo mysql inventory_db << 'EOF'
-- Add profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create ticket permissions
INSERT IGNORE INTO permissions (name, description, category, is_active, created_at) 
VALUES 
    ('TICKETS_MANAGE', 'Manage tickets and ticket system', 'Tickets', 1, NOW()),
    ('TICKETS_VIEW', 'View tickets', 'Tickets', 1, NOW()),
    ('TICKETS_CREATE', 'Create new tickets', 'Tickets', 1, NOW()),
    ('TICKETS_EDIT', 'Edit existing tickets', 'Tickets', 1, NOW());

-- Assign to super_admin
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, id, NOW() FROM permissions WHERE name IN ('TICKETS_MANAGE', 'TICKETS_VIEW', 'TICKETS_CREATE', 'TICKETS_EDIT');

SELECT 'SETUP COMPLETE' as status;
EOF
        ;;
    2)
        echo ""
        read -s -p "Enter MySQL root password: " password
        echo ""
        mysql -u root -p"$password" inventory_db < add-profile-fields.sql
        mysql -u root -p"$password" inventory_db < ticket-permissions-manual.sql
        ;;
    3)
        echo "Skipping database setup..."
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✅ Database setup completed!"
echo ""

# Create uploads directory
echo "Creating uploads directory..."
mkdir -p public/uploads/avatars
chmod 755 public/uploads/avatars
echo "✅ Uploads directory created"

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Install dependencies: npm install"
echo "2. Build application: npm run build"
echo "3. Start server: pm2 start server.js --name inventory-server"
echo "4. Deploy to Vercel: vercel --prod"
echo ""