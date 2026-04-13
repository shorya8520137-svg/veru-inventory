#!/bin/bash

# Create website_customers table
# Run this on the AWS server

echo "🗄️  Creating website_customers table..."
echo ""

# Database credentials
DB_USER="inventory_user"
DB_PASS="StrongPass@123"
DB_NAME="inventory_db"

# Create the table
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'EOF'

-- Drop table if exists (optional - remove if you want to keep existing data)
-- DROP TABLE IF EXISTS website_customers;

-- Create website_customers table
CREATE TABLE IF NOT EXISTS website_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- Verify table was created
DESCRIBE website_customers;

-- Show success message
SELECT 'Table created successfully!' as status;

EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Table created successfully!"
    echo ""
    echo "🔄 Now restart the server:"
    echo "   pm2 restart dashboard-api-1"
else
    echo ""
    echo "❌ Failed to create table!"
    echo ""
    echo "Try manually:"
    echo "   mysql -u inventory_user -p inventory_db"
    echo "   Password: StrongPass@123"
    echo ""
    echo "Then run:"
    echo "   CREATE TABLE IF NOT EXISTS website_customers (...);"
fi
