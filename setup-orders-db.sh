#!/bin/bash

echo "🔧 Setting up Website Orders Database Tables..."
echo "Using sudo mysql to create tables..."

# Create the website orders tables using sudo mysql
sudo mysql -e "
USE inventory_db;

-- Create website_orders table
CREATE TABLE IF NOT EXISTS website_orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    shipping_address JSON NOT NULL,
    billing_address JSON NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery DATE,
    actual_delivery DATE,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date),
    INDEX idx_order_number (order_number)
);

-- Create website_order_items table
CREATE TABLE IF NOT EXISTS website_order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    customization JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES website_orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON website_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON website_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON website_order_items(order_id, product_id);

-- Create a test user for order testing
INSERT IGNORE INTO users (id, username, email, password, first_name, last_name, role, is_active, created_at) 
VALUES (
    'test_user_001',
    'testuser',
    'test@example.com',
    '\$2b\$10\$rOzJqZxqJZ8rOzJqZxqJZ8rOzJqZxqJZ8rOzJqZxqJZ8rOzJqZxqJ',
    'Test',
    'User',
    'user',
    1,
    NOW()
);

-- Show table structure
DESCRIBE website_orders;
DESCRIBE website_order_items;

-- Show created tables
SHOW TABLES LIKE 'website_%';

SELECT 'Website Orders Database Setup Complete!' as Status;
"

if [ $? -eq 0 ]; then
    echo "✅ Website orders database tables created successfully!"
    echo "📋 Tables created:"
    echo "   - website_orders"
    echo "   - website_order_items"
    echo "👤 Test user created:"
    echo "   Username: testuser"
    echo "   Password: testpass123"
    echo ""
    echo "🎉 Setup complete! You can now test the order API."
else
    echo "❌ Failed to create database tables"
    echo "💡 Make sure MySQL is running and you have sudo privileges"
fi