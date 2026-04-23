-- ============================================
-- ADD SAMPLE DATA TO EXISTING BILLING TABLES
-- ============================================

-- Insert sample data into store_inventory (if not exists)
INSERT IGNORE INTO store_inventory (product_name, barcode, category, stock, price, gst_percentage) VALUES
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
('Water Tank 500L', 'SKU-WT-5000', 'Plumbing', 12, 2500.00, 18.00);

-- Add GST percentage to existing products table (ignore error if column exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_name = 'products' 
     AND table_schema = 'inventory_db' 
     AND column_name = 'gst_percentage') > 0,
    'SELECT "Column gst_percentage already exists" as Info',
    'ALTER TABLE products ADD COLUMN gst_percentage DECIMAL(5, 2) DEFAULT 18.00'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing products with GST percentage
UPDATE products SET gst_percentage = 18.00 WHERE gst_percentage IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show billing tables
SELECT '=== BILLING TABLES ===' as Info;
SHOW TABLES LIKE '%bill%';

-- Show store inventory tables  
SELECT '=== STORE INVENTORY TABLES ===' as Info;
SHOW TABLES LIKE '%store%';

-- Count records
SELECT '=== RECORD COUNTS ===' as Info;
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'store_inventory', COUNT(*) FROM store_inventory
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'store_inventory_logs', COUNT(*) FROM store_inventory_logs;

-- Show sample products
SELECT '=== SAMPLE STORE INVENTORY ===' as Info;
SELECT product_name, barcode, price, stock FROM store_inventory LIMIT 5;

-- Show products with GST
SELECT '=== PRODUCTS WITH GST ===' as Info;
SELECT product_name, sku, price, gst_percentage FROM products LIMIT 5;

SELECT 'BILLING SYSTEM READY!' as Status;