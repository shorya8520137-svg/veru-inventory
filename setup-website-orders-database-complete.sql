-- =====================================================
-- Website Orders Database Setup - Complete Schema
-- =====================================================
-- This script creates all necessary tables for website orders
-- and ensures proper integration with the inventory system

USE inventory_db;

-- =====================================================
-- 1. CREATE WEBSITE ORDERS TABLE
-- =====================================================
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
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date),
    INDEX idx_order_number (order_number),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 2. CREATE WEBSITE ORDER ITEMS TABLE
-- =====================================================
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
    
    -- Foreign key constraint
    FOREIGN KEY (order_id) REFERENCES website_orders(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    INDEX idx_order_product (order_id, product_id)
);

-- =====================================================
-- 3. CREATE ORDER STATUS HISTORY TABLE (for tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS website_order_status_history (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES website_orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_changed_at (changed_at)
);

-- =====================================================
-- 4. CREATE INVENTORY INTEGRATION TABLE
-- =====================================================
-- This table links website orders to inventory system
CREATE TABLE IF NOT EXISTS website_order_inventory_sync (
    id VARCHAR(255) PRIMARY KEY,
    website_order_id VARCHAR(255) NOT NULL,
    inventory_order_id VARCHAR(255),
    sync_status ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
    sync_date TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (website_order_id) REFERENCES website_orders(id) ON DELETE CASCADE,
    INDEX idx_website_order_id (website_order_id),
    INDEX idx_sync_status (sync_status)
);

-- =====================================================
-- 5. CREATE TEST USER FOR ORDERS (if not exists)
-- =====================================================
INSERT IGNORE INTO users (
    id, 
    username, 
    email, 
    password, 
    first_name, 
    last_name, 
    role, 
    is_active, 
    created_at
) VALUES (
    'test_user_orders_001',
    'ordertest',
    'ordertest@example.com',
    '$2b$10$rOzJqZxqJZ8rOzJqZxqJZ8rOzJqZxqJZ8rOzJqZxqJZ8rOzJqZxqJ', -- password: testpass123
    'Order',
    'Tester',
    'user',
    1,
    NOW()
);

-- =====================================================
-- 6. CREATE SAMPLE WEBSITE PRODUCTS (if not exists)
-- =====================================================
-- Ensure we have some products to test orders with
INSERT IGNORE INTO website_products (
    id, 
    product_name, 
    description, 
    price, 
    category_id, 
    sku, 
    stock_quantity, 
    is_active, 
    created_at
) VALUES 
(
    'test_product_001',
    'Custom Gift Box',
    'Beautiful customizable gift box perfect for any occasion',
    149.99,
    1,
    'GIFT-BOX-001',
    100,
    1,
    NOW()
),
(
    'test_product_002',
    'Personalized Mug',
    'Custom printed mug with your personal message',
    24.99,
    1,
    'MUG-CUSTOM-001',
    50,
    1,
    NOW()
);

-- =====================================================
-- 7. CREATE SAMPLE CATEGORY (if not exists)
-- =====================================================
INSERT IGNORE INTO website_categories (
    id,
    name,
    slug,
    description,
    is_active,
    created_at
) VALUES (
    1,
    'Gifts',
    'gifts',
    'Custom gifts and personalized items',
    1,
    NOW()
);

-- =====================================================
-- 8. CREATE TRIGGERS FOR ORDER STATUS TRACKING
-- =====================================================
DELIMITER $$

-- Trigger to log status changes
CREATE TRIGGER IF NOT EXISTS website_order_status_change_log
AFTER UPDATE ON website_orders
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO website_order_status_history (
            id,
            order_id,
            old_status,
            new_status,
            changed_at
        ) VALUES (
            CONCAT('status_', NEW.id, '_', UNIX_TIMESTAMP()),
            NEW.id,
            OLD.status,
            NEW.status,
            NOW()
        );
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 9. CREATE VIEWS FOR EASY QUERYING
-- =====================================================

-- View for order summary with customer info
CREATE OR REPLACE VIEW website_order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.currency,
    o.payment_status,
    o.payment_method,
    o.order_date,
    o.estimated_delivery,
    o.tracking_number,
    JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.name')) as customer_name,
    JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.email')) as customer_email,
    JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.phone')) as customer_phone,
    COUNT(oi.id) as item_count,
    u.username
FROM website_orders o
LEFT JOIN website_order_items oi ON o.id = oi.order_id
LEFT JOIN users u ON o.user_id = u.id
GROUP BY o.id;

-- View for detailed order items
CREATE OR REPLACE VIEW website_order_details AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.status as order_status,
    o.total_amount,
    oi.id as item_id,
    oi.product_id,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    oi.customization,
    JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, '$.name')) as customer_name
FROM website_orders o
JOIN website_order_items oi ON o.id = oi.order_id;

-- =====================================================
-- 10. INSERT SAMPLE ORDER DATA FOR TESTING
-- =====================================================
-- Create a sample order for testing
SET @sample_order_id = CONCAT('order_', UNIX_TIMESTAMP(), '_sample');
SET @sample_item_id = CONCAT('item_', UNIX_TIMESTAMP(), '_sample');

INSERT IGNORE INTO website_orders (
    id,
    user_id,
    order_number,
    status,
    total_amount,
    currency,
    payment_status,
    payment_method,
    shipping_address,
    billing_address,
    order_date,
    estimated_delivery,
    notes
) VALUES (
    @sample_order_id,
    'test_user_orders_001',
    CONCAT('ORD-2026-', LPAD(FLOOR(RAND() * 999999), 6, '0')),
    'pending',
    174.98,
    'USD',
    'pending',
    'credit_card',
    JSON_OBJECT(
        'name', 'Sarah Johnson',
        'phone', '+1-555-123-4567',
        'email', 'sarah.johnson@example.com',
        'addressLine1', '1234 Maple Street',
        'addressLine2', 'Apartment 5B',
        'city', 'Los Angeles',
        'state', 'California',
        'postalCode', '90210',
        'country', 'United States'
    ),
    JSON_OBJECT(
        'name', 'Sarah Johnson',
        'phone', '+1-555-123-4567',
        'email', 'sarah.johnson@example.com',
        'addressLine1', '1234 Maple Street',
        'addressLine2', 'Apartment 5B',
        'city', 'Los Angeles',
        'state', 'California',
        'postalCode', '90210',
        'country', 'United States'
    ),
    NOW(),
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    'Please ring doorbell twice. This is a gift!'
);

-- Insert sample order items
INSERT IGNORE INTO website_order_items (
    id,
    order_id,
    product_id,
    product_name,
    product_image,
    quantity,
    unit_price,
    total_price,
    customization
) VALUES 
(
    CONCAT(@sample_item_id, '_1'),
    @sample_order_id,
    'test_product_001',
    'Custom Gift Box',
    '/images/gift-box.jpg',
    1,
    149.99,
    149.99,
    JSON_OBJECT('text', 'Happy Birthday!', 'color', 'blue', 'size', 'large')
),
(
    CONCAT(@sample_item_id, '_2'),
    @sample_order_id,
    'test_product_002',
    'Personalized Mug',
    '/images/mug.jpg',
    1,
    24.99,
    24.99,
    JSON_OBJECT('text', 'Best Mom Ever', 'color', 'pink')
);

-- =====================================================
-- 11. SHOW CREATED TABLES AND SAMPLE DATA
-- =====================================================
SELECT 'Website Orders Database Setup Complete!' as Status;

-- Show table structures
SELECT 'WEBSITE ORDERS TABLE STRUCTURE:' as Info;
DESCRIBE website_orders;

SELECT 'WEBSITE ORDER ITEMS TABLE STRUCTURE:' as Info;
DESCRIBE website_order_items;

-- Show sample data
SELECT 'SAMPLE ORDERS:' as Info;
SELECT * FROM website_order_summary LIMIT 5;

SELECT 'SAMPLE ORDER ITEMS:' as Info;
SELECT * FROM website_order_details LIMIT 5;

-- Show table counts
SELECT 
    'website_orders' as table_name,
    COUNT(*) as record_count
FROM website_orders
UNION ALL
SELECT 
    'website_order_items' as table_name,
    COUNT(*) as record_count
FROM website_order_items
UNION ALL
SELECT 
    'website_products' as table_name,
    COUNT(*) as record_count
FROM website_products
UNION ALL
SELECT 
    'website_categories' as table_name,
    COUNT(*) as record_count
FROM website_categories;