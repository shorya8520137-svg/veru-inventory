-- =====================================================
-- Website Product Management Database Setup
-- =====================================================
-- Run this file to set up all required tables for the Website Product Management system
-- Execute: mysql -u username -p database_name < setup-website-products-database.sql

-- =====================================================
-- 1. CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS website_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (parent_id) REFERENCES website_categories(id) ON DELETE SET NULL,
    
    -- Indexes for Performance
    INDEX idx_category_slug (slug),
    INDEX idx_category_active (is_active),
    INDEX idx_category_parent (parent_id),
    INDEX idx_category_sort (sort_order)
);

-- =====================================================
-- 2. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS website_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    offer_price DECIMAL(10,2) NULL,
    offer_percentage DECIMAL(5,2) NULL,
    image_url VARCHAR(500),
    additional_images JSON,
    category_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE,
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 0,
    weight DECIMAL(8,2),
    dimensions VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    tags JSON,
    attributes JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (category_id) REFERENCES website_categories(id) ON DELETE RESTRICT,
    
    -- Indexes for Performance
    INDEX idx_product_name (product_name),
    INDEX idx_product_sku (sku),
    INDEX idx_product_category (category_id),
    INDEX idx_product_active (is_active),
    INDEX idx_product_featured (is_featured),
    INDEX idx_product_price (price),
    INDEX idx_product_created (created_at),
    INDEX idx_product_search (product_name, description(100)),
    INDEX idx_product_price_range (price, offer_price),
    INDEX idx_product_stock (stock_quantity, min_stock_level)
);

-- =====================================================
-- 3. BULK UPLOADS TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS website_bulk_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL,
    processed_rows INT DEFAULT 0,
    success_rows INT DEFAULT 0,
    error_rows INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_log JSON,
    uploaded_by INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    file_path VARCHAR(500),
    
    -- Indexes for Performance
    INDEX idx_upload_status (status),
    INDEX idx_upload_user (uploaded_by),
    INDEX idx_upload_date (started_at)
);

-- =====================================================
-- 4. PRODUCT VARIANTS TABLE (Optional - for size, color, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS website_product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    sku_suffix VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (product_id) REFERENCES website_products(id) ON DELETE CASCADE,
    
    -- Unique Constraints
    UNIQUE KEY unique_product_variant (product_id, variant_name, variant_value),
    
    -- Indexes for Performance
    INDEX idx_variant_product (product_id),
    INDEX idx_variant_active (is_active)
);

-- =====================================================
-- 5. INSERT DEFAULT CATEGORIES
-- =====================================================
INSERT INTO website_categories (name, description, slug, sort_order) VALUES
('Electronics', 'Electronic devices and gadgets', 'electronics', 1),
('Clothing', 'Apparel and fashion items', 'clothing', 2),
('Home & Garden', 'Home improvement and garden items', 'home-garden', 3),
('Sports & Outdoors', 'Sports equipment and outdoor gear', 'sports-outdoors', 4),
('Books & Media', 'Books, movies, and digital media', 'books-media', 5),
('Health & Beauty', 'Health and beauty products', 'health-beauty', 6),
('Toys & Games', 'Toys and gaming products', 'toys-games', 7),
('Automotive', 'Car parts and automotive accessories', 'automotive', 8)
ON DUPLICATE KEY UPDATE 
    updated_at = CURRENT_TIMESTAMP,
    description = VALUES(description);

-- =====================================================
-- 6. INSERT SAMPLE PRODUCTS (Optional - for testing)
-- =====================================================
INSERT INTO website_products (
    product_name, description, short_description, price, offer_price, 
    image_url, category_id, sku, stock_quantity, min_stock_level, 
    is_active, is_featured, meta_title, meta_description
) VALUES
(
    'Wireless Bluetooth Headphones',
    'High-quality wireless headphones with noise cancellation and 20-hour battery life. Perfect for music lovers and professionals who need crystal clear audio quality.',
    'Premium wireless headphones with noise cancellation',
    99.99, 79.99,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    1, 'WBH-001', 50, 10, TRUE, TRUE,
    'Best Wireless Headphones 2024 - Premium Audio Quality',
    'Premium wireless headphones with noise cancellation and 20-hour battery life. Perfect for music and calls.'
),
(
    'Cotton T-Shirt',
    '100% organic cotton t-shirt available in multiple colors and sizes. Comfortable and breathable fabric perfect for everyday wear.',
    'Organic cotton t-shirt - comfortable and stylish',
    24.99, NULL,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    2, 'CT-001', 100, 20, TRUE, FALSE,
    'Organic Cotton T-Shirt - Comfortable & Sustainable',
    'Comfortable 100% organic cotton t-shirt available in multiple colors and sizes.'
),
(
    'Smart Home Security Camera',
    'WiFi-enabled security camera with 1080p HD video, night vision, and mobile app control. Easy setup and 24/7 monitoring.',
    '1080p WiFi security camera with night vision',
    149.99, 129.99,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    1, 'SHSC-001', 25, 5, TRUE, TRUE,
    'Smart Security Camera 1080p - Home Protection',
    'WiFi security camera with HD video, night vision, and mobile app control for complete home security.'
),
(
    'Yoga Mat Premium',
    'Premium non-slip yoga mat made from eco-friendly materials. Perfect for yoga, pilates, and fitness exercises.',
    'Eco-friendly non-slip yoga mat',
    39.99, 29.99,
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    4, 'YM-001', 75, 15, TRUE, FALSE,
    'Premium Yoga Mat - Non-Slip & Eco-Friendly',
    'Non-slip eco-friendly yoga mat perfect for yoga, pilates, and all fitness activities.'
),
(
    'Coffee Maker Deluxe',
    'Programmable coffee maker with 12-cup capacity and auto-shutoff feature. Brew perfect coffee every time with precision temperature control.',
    '12-cup programmable coffee maker',
    89.99, NULL,
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    3, 'CM-001', 30, 8, TRUE, FALSE,
    '12-Cup Coffee Maker - Programmable & Reliable',
    'Programmable coffee maker with 12-cup capacity, auto-shutoff, and precision brewing technology.'
)
ON DUPLICATE KEY UPDATE 
    updated_at = CURRENT_TIMESTAMP,
    stock_quantity = VALUES(stock_quantity);

-- =====================================================
-- 7. CREATE USEFUL VIEWS
-- =====================================================

-- View for products with category information
CREATE OR REPLACE VIEW website_products_with_category AS
SELECT 
    p.*,
    c.name as category_name,
    c.slug as category_slug,
    CASE 
        WHEN p.offer_price IS NOT NULL AND p.offer_price < p.price 
        THEN p.offer_price 
        ELSE p.price 
    END as final_price,
    CASE 
        WHEN p.offer_price IS NOT NULL AND p.offer_price < p.price 
        THEN ROUND(((p.price - p.offer_price) / p.price) * 100, 2)
        ELSE 0 
    END as discount_percentage
FROM website_products p
JOIN website_categories c ON p.category_id = c.id;

-- View for low stock products
CREATE OR REPLACE VIEW website_low_stock_products AS
SELECT 
    p.*,
    c.name as category_name
FROM website_products p
JOIN website_categories c ON p.category_id = c.id
WHERE p.stock_quantity <= p.min_stock_level
AND p.is_active = TRUE;

-- View for featured products
CREATE OR REPLACE VIEW website_featured_products AS
SELECT 
    p.*,
    c.name as category_name,
    c.slug as category_slug,
    CASE 
        WHEN p.offer_price IS NOT NULL AND p.offer_price < p.price 
        THEN p.offer_price 
        ELSE p.price 
    END as final_price
FROM website_products p
JOIN website_categories c ON p.category_id = c.id
WHERE p.is_featured = TRUE 
AND p.is_active = TRUE
ORDER BY p.created_at DESC;

-- =====================================================
-- 8. CREATE UPLOAD DIRECTORY (Note: This needs to be done on the server)
-- =====================================================
-- mkdir -p uploads/bulk-products
-- chmod 755 uploads/bulk-products

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Tables created successfully!
-- 
-- Next steps:
-- 1. Verify all tables are created: SHOW TABLES LIKE 'website_%';
-- 2. Check sample data: SELECT COUNT(*) FROM website_products;
-- 3. Test the API endpoints
-- 4. Upload CSV files for bulk import testing
--
-- For troubleshooting:
-- - Check table structure: DESCRIBE website_products;
-- - View sample data: SELECT * FROM website_products_with_category LIMIT 5;
-- - Check categories: SELECT * FROM website_categories;

COMMIT;