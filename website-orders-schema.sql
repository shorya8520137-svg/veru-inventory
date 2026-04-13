-- Website Orders Database Schema
-- This script creates the necessary tables for the website orders system

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

-- Insert sample data for testing (optional)
-- You can uncomment these lines to add test data

/*
-- Sample order
INSERT INTO website_orders (
    id, user_id, order_number, status, total_amount, currency,
    payment_status, payment_method, shipping_address, billing_address,
    order_date, estimated_delivery, notes
) VALUES (
    'order_sample_001',
    'user_123',
    'ORD-2026-001',
    'pending',
    299.99,
    'USD',
    'pending',
    'credit_card',
    '{"name": "John Doe", "phone": "+1234567890", "email": "john@example.com", "addressLine1": "123 Main St", "city": "New York", "state": "NY", "postalCode": "10001", "country": "USA"}',
    '{"name": "John Doe", "phone": "+1234567890", "email": "john@example.com", "addressLine1": "123 Main St", "city": "New York", "state": "NY", "postalCode": "10001", "country": "USA"}',
    NOW(),
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    'Please handle with care'
);

-- Sample order items
INSERT INTO website_order_items (
    id, order_id, product_id, product_name, product_image,
    quantity, unit_price, total_price, customization
) VALUES (
    'item_sample_001',
    'order_sample_001',
    'prod_123',
    'Custom Gift Box',
    '/images/gift-box.jpg',
    2,
    149.99,
    299.98,
    '{"text": "Happy Birthday", "color": "blue", "size": "medium"}'
);
*/

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON website_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON website_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON website_order_items(order_id, product_id);

-- Show table structure
DESCRIBE website_orders;
DESCRIBE website_order_items;