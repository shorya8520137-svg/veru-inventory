-- ============================================
-- COMPLETE BILLING SYSTEM DATABASE SETUP
-- ============================================
-- Run this entire file in your MySQL database
-- This will create all tables needed for the billing system
-- ============================================

-- 1. BILLS TABLE - Stores all invoices (B2B & B2C)
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    bill_type ENUM('B2B', 'B2C') NOT NULL DEFAULT 'B2C',
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_email VARCHAR(255),
    billing_address TEXT,
    shipping_address TEXT,
    gstin VARCHAR(50),
    business_name VARCHAR(255),
    place_of_supply VARCHAR(100),
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    shipping DECIMAL(12, 2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_mode ENUM('cash', 'upi', 'card', 'bank') NOT NULL DEFAULT 'cash',
    payment_status ENUM('paid', 'partial', 'unpaid') NOT NULL DEFAULT 'paid',
    items JSON NOT NULL,
    total_items INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_customer_phone (customer_phone),
    INDEX idx_bill_type (bill_type),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. STORE INVENTORY TABLE - Tracks product stock in store
CREATE TABLE IF NOT EXISTS store_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    stock INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    gst_percentage DECIMAL(5, 2) DEFAULT 18.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_barcode (barcode),
    INDEX idx_product_name (product_name),
    INDEX idx_stock (stock),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. STORE INVENTORY LOGS TABLE - Audit trail for all stock movements
CREATE TABLE IF NOT EXISTS store_inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    movement_type ENUM('SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN') NOT NULL,
    quantity INT NOT NULL,
    reference_id VARCHAR(100),
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_barcode (barcode),
    INDEX idx_movement_type (movement_type),
    INDEX idx_reference_id (reference_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PRODUCTS TABLE - Master product catalog (if not exists)
CREATE TABLE IF NOT EXISTS products (
    p_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    gst_percentage DECIMAL(5, 2) DEFAULT 18.00,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_barcode (barcode),
    INDEX idx_product_name (product_name),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert sample products into products table
INSERT INTO products (product_name, barcode, category, price, gst_percentage, description, is_active) VALUES
('Architectural Steel Beam', 'SKU-A28-392-X', 'Construction', 450.00, 18.00, 'Heavy duty steel beam for construction', TRUE),
('Precision Glass Panel', 'SKU-PGP-4064', 'Glass', 820.00, 12.00, 'High quality tempered glass panel', TRUE),
('Industrial Bolt Set', 'SKU-IBS-1001', 'Hardware', 25.00, 18.00, 'Set of 100 industrial grade bolts', TRUE),
('Ceramic Tile Premium', 'SKU-CTP-5500', 'Tiles', 15.00, 12.00, 'Premium ceramic floor tiles', TRUE),
('LED Panel Light 40W', 'SKU-LED-4040', 'Lighting', 120.00, 18.00, '40W LED panel light with 3 year warranty', TRUE),
('Copper Wire 2.5mm', 'SKU-CW-2500', 'Electrical', 180.00, 18.00, '2.5mm copper electrical wire per meter', TRUE),
('PVC Pipe 4 inch', 'SKU-PVC-4000', 'Plumbing', 95.00, 18.00, '4 inch PVC pipe for plumbing', TRUE),
('Paint Primer White', 'SKU-PPW-1000', 'Paint', 45.00, 18.00, 'White primer paint 1 liter', TRUE),
('Cement Bag 50kg', 'SKU-CB-5000', 'Construction', 350.00, 18.00, '50kg cement bag OPC 53 grade', TRUE),
('Wooden Plank Oak', 'SKU-WPO-2400', 'Wood', 280.00, 12.00, 'Oak wood plank 6 feet', TRUE),
('Marble Tile White', 'SKU-MTW-3300', 'Tiles', 450.00, 12.00, 'Italian white marble tile', TRUE),
('Door Handle Brass', 'SKU-DHB-7700', 'Hardware', 180.00, 18.00, 'Brass door handle with lock', TRUE),
('Window Frame Aluminum', 'SKU-WFA-8800', 'Hardware', 650.00, 18.00, 'Aluminum window frame 4x3 feet', TRUE),
('Electrical Switch Board', 'SKU-ESB-9900', 'Electrical', 85.00, 18.00, '4 switch modular board', TRUE),
('Water Tank 500L', 'SKU-WT-5000', 'Plumbing', 2500.00, 18.00, '500 liter overhead water tank', TRUE)
ON DUPLICATE KEY UPDATE 
    price = VALUES(price),
    gst_percentage = VALUES(gst_percentage),
    is_active = VALUES(is_active);

-- Insert sample data into store_inventory
INSERT INTO store_inventory (product_name, barcode, category, stock, price, gst_percentage) VALUES
('Architectural Steel Beam', 'SKU-A28-392-X', 'Construction', 45, 450.00, 18.00),
('Precision Glass Panel', 'SKU-PGP-4064', 'Glass', 28, 820.00, 12.00),
('Industrial Bolt Set', 'SKU-IBS-1001', 'Hardware', 150, 25.00, 18.00),
('Ceramic Tile Premium', 'SKU-CTP-5500', 'Tiles', 200, 15.00, 12.00),
('LED Panel Light 40W', 'SKU-LED-4040', 'Lighting', 75, 120.00, 18.00),
('Copper Wire 2.5mm', 'SKU-CW-2500', 'Electrical', 8, 180.00, 18.00),
('PVC Pipe 4 inch', 'SKU-PVC-4000', 'Plumbing', 3, 95.00, 18.00),
('Paint Primer White', 'SKU-PPW-1000', 'Paint', 60, 45.00, 18.00),
('Cement Bag 50kg', 'SKU-CB-5000', 'Construction', 0, 350.00, 18.00),
('Wooden Plank Oak', 'SKU-WPO-2400', 'Wood', 35, 280.00, 12.00),
('Marble Tile White', 'SKU-MTW-3300', 'Tiles', 50, 450.00, 12.00),
('Door Handle Brass', 'SKU-DHB-7700', 'Hardware', 120, 180.00, 18.00),
('Window Frame Aluminum', 'SKU-WFA-8800', 'Hardware', 25, 650.00, 18.00),
('Electrical Switch Board', 'SKU-ESB-9900', 'Electrical', 90, 85.00, 18.00),
('Water Tank 500L', 'SKU-WT-5000', 'Plumbing', 12, 2500.00, 18.00)
ON DUPLICATE KEY UPDATE 
    stock = VALUES(stock),
    price = VALUES(price),
    gst_percentage = VALUES(gst_percentage);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables were created successfully
SELECT 'Tables Created Successfully!' as Status;

-- Show table structures
SHOW TABLES LIKE '%bill%';
SHOW TABLES LIKE '%store%';
SHOW TABLES LIKE '%product%';

-- Count records in each table
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'store_inventory', COUNT(*) FROM store_inventory
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'store_inventory_logs', COUNT(*) FROM store_inventory_logs;

-- Show sample data
SELECT 'Sample Products:' as Info;
SELECT product_name, barcode, price, stock FROM store_inventory LIMIT 5;

-- ============================================
-- USEFUL QUERIES FOR TESTING
-- ============================================

-- Get low stock items (stock <= 10)
-- SELECT product_name, barcode, stock, price 
-- FROM store_inventory 
-- WHERE stock <= 10 
-- ORDER BY stock ASC;

-- Get out of stock items
-- SELECT product_name, barcode, category 
-- FROM store_inventory 
-- WHERE stock = 0;

-- Get total inventory value
-- SELECT 
--     SUM(stock * price) as total_inventory_value,
--     COUNT(*) as total_products,
--     SUM(CASE WHEN stock <= 10 THEN 1 ELSE 0 END) as low_stock_count,
--     SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count
-- FROM store_inventory;

-- Get recent bills
-- SELECT 
--     invoice_number,
--     bill_type,
--     customer_name,
--     customer_phone,
--     grand_total,
--     payment_status,
--     created_at
-- FROM bills
-- ORDER BY created_at DESC
-- LIMIT 10;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your billing system database is now ready to use!
-- 
-- Next steps:
-- 1. Verify all tables are created
-- 2. Check sample data is inserted
-- 3. Start using the billing system
-- 
-- Access the system at: /billing/create
-- ============================================
