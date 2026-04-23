-- Fix inventory sync by adding warehouse products to store inventory

-- Add warehouse products to store inventory with 0 initial stock
INSERT INTO store_inventory (product_name, barcode, category, stock, price, gst_percentage) 
VALUES 
    ('Unknown Product A', '2460-3499', 'General', 0, 100.00, 18.00),
    ('Unknown Product B', '2025-885', 'General', 0, 150.00, 18.00),
    ('Unknown Product C', '493-11471', 'General', 0, 120.00, 18.00),
    ('Unknown Product D', '638-30500', 'General', 0, 80.00, 18.00)
ON DUPLICATE KEY UPDATE 
    product_name = VALUES(product_name),
    price = VALUES(price);

-- Verify the products were added
SELECT 'ADDED PRODUCTS:' as status;
SELECT product_name, barcode, stock FROM store_inventory WHERE barcode IN ('2460-3499', '2025-885', '493-11471', '638-30500');