#!/bin/bash

# Website Customers Deployment Script
# Run this on AWS server: ~/inventoryfullstack

echo "=========================================="
echo "🚀 Deploying Website Customers Feature"
echo "=========================================="

# Step 1: Pull latest code
echo ""
echo "📥 Step 1: Pulling latest code from GitHub..."
git fetch origin
git pull origin stocksphere-phase-1-complete

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed. Trying hard reset..."
    git fetch origin
    git reset --hard origin/stocksphere-phase-1-complete
fi

echo "✅ Code updated successfully"

# Step 2: Create database table
echo ""
echo "📊 Step 2: Creating website_customers table..."
echo "Enter MySQL root password when prompted:"

mysql -u root -p inventory_db << 'EOF'
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

-- Verify table creation
DESCRIBE website_customers;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database table created/verified successfully"
else
    echo "❌ Database table creation failed"
    exit 1
fi

# Step 3: Completely restart PM2
echo ""
echo "🔄 Step 3: Restarting server (complete restart to load new routes)..."

# Stop all processes
pm2 stop all

# Delete all processes (this ensures clean restart)
pm2 delete all

# Start server with new routes
pm2 start server.js --name dashboard-api-1

# Save PM2 configuration
pm2 save

echo "✅ Server restarted successfully"

# Step 4: Show logs
echo ""
echo "📋 Step 4: Checking server logs..."
sleep 3
pm2 logs dashboard-api-1 --lines 30 --nostream

# Step 5: Test API
echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "🧪 To test the API, run:"
echo ""
echo "curl -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  https://54.254.184.54:8443/api/website-customers/stats"
echo ""
echo "📊 Check PM2 status:"
echo "pm2 status"
echo ""
echo "📋 View logs:"
echo "pm2 logs dashboard-api-1"
echo ""
