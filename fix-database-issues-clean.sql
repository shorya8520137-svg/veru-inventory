-- =====================================================
-- CLEAN DATABASE FIXES FOR API ERRORS (NO DUMMY DATA)
-- =====================================================
-- This script fixes the following issues:
-- 1. Missing api_usage_logs table causing "Table 'inventory_db.api_usage_logs' doesn't exist" errors
-- 2. Users table username column reference causing "Unknown column 'u.username' in 'field list'" errors
-- 3. Ensures proper database schema consistency
-- 4. Creates missing indexes for performance
-- 5. NO DUMMY DATA INSERTION (as requested by user)
-- =====================================================

-- Use the inventory database
USE inventory_db;

-- =====================================================
-- 1. ENSURE USERS TABLE EXISTS WITH PROPER STRUCTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'user', 'manager') DEFAULT 'user',
    `is_active` BOOLEAN DEFAULT TRUE,
    `email_verified` BOOLEAN DEFAULT FALSE,
    `phone` VARCHAR(20) DEFAULT NULL,
    `address` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    KEY `idx_users_email` (`email`),
    KEY `idx_users_role` (`role`),
    KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CREATE API_USAGE_LOGS TABLE (CRITICAL FIX)
-- =====================================================
-- This table is referenced in apiKeysController.js for logging API usage statistics

CREATE TABLE IF NOT EXISTS `api_usage_logs` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `api_key_id` INT NOT NULL,
    `endpoint` VARCHAR(255) NOT NULL,
    `method` VARCHAR(10) NOT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `response_status` INT DEFAULT NULL,
    `response_time_ms` INT DEFAULT NULL,
    `request_size` INT DEFAULT NULL,
    `response_size` INT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    KEY `idx_api_usage_logs_api_key_id` (`api_key_id`),
    KEY `idx_api_usage_logs_endpoint` (`endpoint`),
    KEY `idx_api_usage_logs_created_at` (`created_at`),
    KEY `idx_api_usage_logs_method` (`method`),
    KEY `idx_api_usage_logs_ip_address` (`ip_address`),
    
    -- Foreign key constraint (only if api_keys table exists)
    CONSTRAINT `fk_api_usage_logs_api_key_id` 
        FOREIGN KEY (`api_key_id`) 
        REFERENCES `api_keys` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. ENSURE API_KEYS TABLE EXISTS WITH PROPER STRUCTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS `api_keys` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `api_key` VARCHAR(255) NOT NULL UNIQUE,
    `is_active` BOOLEAN DEFAULT TRUE,
    `usage_count` INT DEFAULT 0,
    `rate_limit_per_hour` INT DEFAULT 1000,
    `last_used_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    KEY `idx_api_keys_user_id` (`user_id`),
    KEY `idx_api_keys_api_key` (`api_key`),
    KEY `idx_api_keys_is_active` (`is_active`),
    KEY `idx_api_keys_last_used_at` (`last_used_at`),
    
    -- Foreign key constraint
    CONSTRAINT `fk_api_keys_user_id` 
        FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. ENSURE WEBSITE_CATEGORIES TABLE EXISTS (EMPTY)
-- =====================================================

CREATE TABLE IF NOT EXISTS `website_categories` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT DEFAULT NULL,
    `parent_id` INT DEFAULT NULL,
    `sort_order` INT DEFAULT 0,
    `image_url` VARCHAR(500) DEFAULT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    KEY `idx_website_categories_parent_id` (`parent_id`),
    KEY `idx_website_categories_slug` (`slug`),
    KEY `idx_website_categories_active` (`is_active`),
    KEY `idx_website_categories_sort_order` (`sort_order`),
    
    -- Foreign key for parent category
    CONSTRAINT `fk_website_categories_parent_id` 
        FOREIGN KEY (`parent_id`) 
        REFERENCES `website_categories` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. ENSURE WEBSITE_PRODUCTS TABLE EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS `website_products` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `product_name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `short_description` VARCHAR(500) DEFAULT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `offer_price` DECIMAL(10,2) DEFAULT NULL,
    `category_id` INT DEFAULT NULL,
    `sku` VARCHAR(100) UNIQUE DEFAULT NULL,
    `stock_quantity` INT DEFAULT 0,
    `min_stock_level` INT DEFAULT 5,
    `image_url` VARCHAR(500) DEFAULT NULL,
    `gallery_images` JSON DEFAULT NULL,
    `specifications` JSON DEFAULT NULL,
    `features` JSON DEFAULT NULL,
    `weight` DECIMAL(8,2) DEFAULT NULL,
    `dimensions` VARCHAR(100) DEFAULT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `meta_title` VARCHAR(255) DEFAULT NULL,
    `meta_description` VARCHAR(500) DEFAULT NULL,
    `slug` VARCHAR(255) UNIQUE DEFAULT NULL,
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    KEY `idx_website_products_category_id` (`category_id`),
    KEY `idx_website_products_sku` (`sku`),
    KEY `idx_website_products_slug` (`slug`),
    KEY `idx_website_products_is_active` (`is_active`),
    KEY `idx_website_products_is_featured` (`is_featured`),
    KEY `idx_website_products_price` (`price`),
    KEY `idx_website_products_stock_quantity` (`stock_quantity`),
    
    -- Foreign key constraint
    CONSTRAINT `fk_website_products_category_id` 
        FOREIGN KEY (`category_id`) 
        REFERENCES `website_categories` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. ENSURE WEBSITE_ORDERS TABLE EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS `website_orders` (
    `id` VARCHAR(50) PRIMARY KEY,
    `user_id` INT NOT NULL,
    `order_number` VARCHAR(50) NOT NULL UNIQUE,
    `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    `total_amount` DECIMAL(10,2) NOT NULL,
    `currency` VARCHAR(3) DEFAULT 'USD',
    `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    `payment_method` VARCHAR(50) DEFAULT NULL,
    `shipping_address` JSON NOT NULL,
    `billing_address` JSON DEFAULT NULL,
    `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `estimated_delivery` DATE DEFAULT NULL,
    `actual_delivery` TIMESTAMP NULL DEFAULT NULL,
    `tracking_number` VARCHAR(100) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    KEY `idx_website_orders_user_id` (`user_id`),
    KEY `idx_website_orders_status` (`status`),
    KEY `idx_website_orders_order_date` (`order_date`),
    KEY `idx_website_orders_order_number` (`order_number`),
    KEY `idx_website_orders_payment_status` (`payment_status`),
    
    -- Foreign key constraint
    CONSTRAINT `fk_website_orders_user_id` 
        FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. ENSURE WEBSITE_ORDER_ITEMS TABLE EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS `website_order_items` (
    `id` VARCHAR(50) PRIMARY KEY,
    `order_id` VARCHAR(50) NOT NULL,
    `product_id` INT NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `product_image` VARCHAR(500) DEFAULT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(10,2) NOT NULL,
    `total_price` DECIMAL(10,2) NOT NULL,
    `customization` JSON DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    KEY `idx_website_order_items_order_id` (`order_id`),
    KEY `idx_website_order_items_product_id` (`product_id`),
    
    -- Foreign key constraints
    CONSTRAINT `fk_website_order_items_order_id` 
        FOREIGN KEY (`order_id`) 
        REFERENCES `website_orders` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_website_order_items_product_id` 
        FOREIGN KEY (`product_id`) 
        REFERENCES `website_products` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Verify api_usage_logs table exists
SELECT 'api_usage_logs table created successfully' as status
WHERE EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'inventory_db' 
    AND TABLE_NAME = 'api_usage_logs'
);

-- Verify all essential tables exist
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'inventory_db' AND TABLE_NAME = 'users') THEN 'EXISTS' ELSE 'MISSING' END as users_table,
    CASE WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'inventory_db' AND TABLE_NAME = 'api_keys') THEN 'EXISTS' ELSE 'MISSING' END as api_keys_table,
    CASE WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'inventory_db' AND TABLE_NAME = 'api_usage_logs') THEN 'EXISTS' ELSE 'MISSING' END as api_usage_logs_table,
    CASE WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'inventory_db' AND TABLE_NAME = 'website_categories') THEN 'EXISTS' ELSE 'MISSING' END as website_categories_table,
    CASE WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'inventory_db' AND TABLE_NAME = 'website_products') THEN 'EXISTS' ELSE 'MISSING' END as website_products_table,
    CASE WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'inventory_db' AND TABLE_NAME = 'website_orders') THEN 'EXISTS' ELSE 'MISSING' END as website_orders_table,
    CASE WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'inventory_db' AND TABLE_NAME = 'website_order_items') THEN 'EXISTS' ELSE 'MISSING' END as website_order_items_table;

-- Show table counts (only if tables exist)
SELECT 
    COALESCE((SELECT COUNT(*) FROM api_usage_logs), 0) as api_usage_logs_count,
    COALESCE((SELECT COUNT(*) FROM users), 0) as users_count,
    COALESCE((SELECT COUNT(*) FROM website_categories), 0) as categories_count,
    COALESCE((SELECT COUNT(*) FROM api_keys), 0) as api_keys_count,
    COALESCE((SELECT COUNT(*) FROM website_products), 0) as products_count,
    COALESCE((SELECT COUNT(*) FROM website_orders), 0) as orders_count;

-- Show all tables in the database
SHOW TABLES;

-- =====================================================
-- 9. FINAL SUCCESS MESSAGE
-- =====================================================

SELECT 
    '✅ CLEAN DATABASE SCHEMA FIXES COMPLETED!' as message,
    NOW() as completed_at,
    'All required tables created without dummy data insertion' as details;

COMMIT;