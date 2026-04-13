-- =====================================================
-- Website Products Database Setup (Clean - No Dummy Data)
-- =====================================================
-- Execute: mysql -u username -p database_name < website-products-clean-setup.sql

-- =====================================================
-- 1. CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `website_categories` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `parent_id` INT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`parent_id`) REFERENCES `website_categories`(`id`) ON DELETE SET NULL,
    
    INDEX `idx_category_slug` (`slug`),
    INDEX `idx_category_active` (`is_active`),
    INDEX `idx_category_parent` (`parent_id`),
    INDEX `idx_category_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `website_products` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `product_name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `short_description` VARCHAR(500),
    `price` DECIMAL(10,2) NOT NULL,
    `offer_price` DECIMAL(10,2) NULL,
    `offer_percentage` DECIMAL(5,2) NULL,
    `image_url` VARCHAR(500),
    `additional_images` JSON,
    `category_id` INT NOT NULL,
    `sku` VARCHAR(100) UNIQUE,
    `stock_quantity` INT DEFAULT 0,
    `min_stock_level` INT DEFAULT 0,
    `weight` DECIMAL(8,2),
    `dimensions` VARCHAR(100),
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `meta_title` VARCHAR(255),
    `meta_description` VARCHAR(500),
    `tags` JSON,
    `attributes` JSON,
    `created_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`category_id`) REFERENCES `website_categories`(`id`) ON DELETE RESTRICT,
    
    INDEX `idx_product_name` (`product_name`),
    INDEX `idx_product_sku` (`sku`),
    INDEX `idx_product_category` (`category_id`),
    INDEX `idx_product_active` (`is_active`),
    INDEX `idx_product_featured` (`is_featured`),
    INDEX `idx_product_price` (`price`),
    INDEX `idx_product_created` (`created_at`),
    INDEX `idx_product_search` (`product_name`, `description`(100)),
    INDEX `idx_product_price_range` (`price`, `offer_price`),
    INDEX `idx_product_stock` (`stock_quantity`, `min_stock_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. BULK UPLOADS TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `website_bulk_uploads` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `filename` VARCHAR(255) NOT NULL,
    `total_rows` INT NOT NULL,
    `processed_rows` INT DEFAULT 0,
    `success_rows` INT DEFAULT 0,
    `error_rows` INT DEFAULT 0,
    `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    `error_log` JSON,
    `uploaded_by` INT,
    `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL,
    `file_path` VARCHAR(500),
    
    INDEX `idx_upload_status` (`status`),
    INDEX `idx_upload_user` (`uploaded_by`),
    INDEX `idx_upload_date` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. PRODUCT VARIANTS TABLE (Optional)
-- =====================================================
CREATE TABLE IF NOT EXISTS `website_product_variants` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `product_id` INT NOT NULL,
    `variant_name` VARCHAR(100) NOT NULL,
    `variant_value` VARCHAR(100) NOT NULL,
    `price_adjustment` DECIMAL(10,2) DEFAULT 0.00,
    `stock_quantity` INT DEFAULT 0,
    `sku_suffix` VARCHAR(50),
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`product_id`) REFERENCES `website_products`(`id`) ON DELETE CASCADE,
    
    UNIQUE KEY `unique_product_variant` (`product_id`, `variant_name`, `variant_value`),
    INDEX `idx_variant_product` (`product_id`),
    INDEX `idx_variant_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. USEFUL VIEWS
-- =====================================================

-- Products with category information
CREATE OR REPLACE VIEW `website_products_with_category` AS
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

-- Low stock products
CREATE OR REPLACE VIEW `website_low_stock_products` AS
SELECT 
    p.*,
    c.name as category_name
FROM website_products p
JOIN website_categories c ON p.category_id = c.id
WHERE p.stock_quantity <= p.min_stock_level
AND p.is_active = TRUE;

-- Featured products
CREATE OR REPLACE VIEW `website_featured_products` AS
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
-- 6. BASIC CATEGORIES (Minimal Setup)
-- =====================================================
INSERT IGNORE INTO `website_categories` (`name`, `description`, `slug`, `sort_order`) VALUES
('Electronics', 'Electronic devices and gadgets', 'electronics', 1),
('Clothing', 'Apparel and fashion items', 'clothing', 2),
('Home & Garden', 'Home improvement and garden items', 'home-garden', 3),
('Sports & Outdoors', 'Sports equipment and outdoor gear', 'sports-outdoors', 4),
('Books & Media', 'Books, movies, and digital media', 'books-media', 5),
('Health & Beauty', 'Health and beauty products', 'health-beauty', 6),
('Toys & Games', 'Toys and gaming products', 'toys-games', 7),
('Automotive', 'Car parts and automotive accessories', 'automotive', 8);

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Tables created successfully!
-- 
-- Verify setup:
-- SHOW TABLES LIKE 'website_%';
-- SELECT * FROM website_categories;
--
-- Ready for production use!

COMMIT;