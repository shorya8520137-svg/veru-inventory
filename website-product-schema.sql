-- Website Product Management Database Schema
-- This creates tables for website product management with bulk upload support

-- Categories table for product categorization
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
    FOREIGN KEY (parent_id) REFERENCES website_categories(id) ON DELETE SET NULL,
    INDEX idx_category_slug (slug),
    INDEX idx_category_active (is_active),
    INDEX idx_category_parent (parent_id)
);

-- Website products table
CREATE TABLE IF NOT EXISTS website_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    offer_price DECIMAL(10,2) NULL,
    offer_percentage DECIMAL(5,2) NULL,
    image_url VARCHAR(500),
    additional_images JSON, -- Store multiple image URLs as JSON array
    category_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE,
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 0,
    weight DECIMAL(8,2),
    dimensions VARCHAR(100), -- e.g., "10x20x30 cm"
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    tags JSON, -- Store tags as JSON array
    attributes JSON, -- Store product attributes as JSON object
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES website_categories(id) ON DELETE RESTRICT,
    INDEX idx_product_name (product_name),
    INDEX idx_product_sku (sku),
    INDEX idx_product_category (category_id),
    INDEX idx_product_active (is_active),
    INDEX idx_product_featured (is_featured),
    INDEX idx_product_price (price),
    INDEX idx_product_created (created_at)
);

-- Bulk upload tracking table
CREATE TABLE IF NOT EXISTS website_bulk_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL,
    processed_rows INT DEFAULT 0,
    success_rows INT DEFAULT 0,
    error_rows INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_log JSON, -- Store errors as JSON array
    uploaded_by INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    file_path VARCHAR(500),
    INDEX idx_upload_status (status),
    INDEX idx_upload_user (uploaded_by),
    INDEX idx_upload_date (started_at)
);

-- Product variants table (for size, color, etc.)
CREATE TABLE IF NOT EXISTS website_product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL, -- e.g., "Size", "Color"
    variant_value VARCHAR(100) NOT NULL, -- e.g., "Large", "Red"
    price_adjustment DECIMAL(10,2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    sku_suffix VARCHAR(50), -- e.g., "-LG", "-RED"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES website_products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_variant (product_id, variant_name, variant_value),
    INDEX idx_variant_product (product_id),
    INDEX idx_variant_active (is_active)
);

-- Insert default categories
INSERT INTO website_categories (name, description, slug, sort_order) VALUES
('Electronics', 'Electronic devices and gadgets', 'electronics', 1),
('Clothing', 'Apparel and fashion items', 'clothing', 2),
('Home & Garden', 'Home improvement and garden items', 'home-garden', 3),
('Sports & Outdoors', 'Sports equipment and outdoor gear', 'sports-outdoors', 4),
('Books & Media', 'Books, movies, and digital media', 'books-media', 5),
('Health & Beauty', 'Health and beauty products', 'health-beauty', 6),
('Toys & Games', 'Toys and gaming products', 'toys-games', 7),
('Automotive', 'Car parts and automotive accessories', 'automotive', 8)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Sample data for testing
INSERT INTO website_products (
    product_name, description, short_description, price, offer_price, 
    image_url, category_id, sku, stock_quantity, is_active, is_featured
) VALUES
(
    'Wireless Bluetooth Headphones',
    'High-quality wireless headphones with noise cancellation and 20-hour battery life. Perfect for music lovers and professionals.',
    'Premium wireless headphones with noise cancellation',
    99.99, 79.99,
    'https://example.com/images/headphones.jpg',
    1, 'WBH-001', 50, TRUE, TRUE
),
(
    'Cotton T-Shirt',
    '100% organic cotton t-shirt available in multiple colors and sizes. Comfortable and breathable fabric.',
    'Organic cotton t-shirt - comfortable and stylish',
    24.99, NULL,
    'https://example.com/images/tshirt.jpg',
    2, 'CT-001', 100, TRUE, FALSE
),
(
    'Smart Home Security Camera',
    'WiFi-enabled security camera with 1080p HD video, night vision, and mobile app control.',
    '1080p WiFi security camera with night vision',
    149.99, 129.99,
    'https://example.com/images/camera.jpg',
    1, 'SHSC-001', 25, TRUE, TRUE
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX idx_products_search ON website_products(product_name, description(100));
CREATE INDEX idx_products_price_range ON website_products(price, offer_price);
CREATE INDEX idx_products_stock ON website_products(stock_quantity, min_stock_level);

-- Views for easier querying
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
    c.slug as category_slug
FROM website_products p
JOIN website_categories c ON p.category_id = c.id
WHERE p.is_featured = TRUE 
AND p.is_active = TRUE
ORDER BY p.created_at DESC;

COMMIT;