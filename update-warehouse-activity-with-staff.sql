-- Update warehouse_order_activity table to include warehouse and processed_by fields
-- Remove phone_number and add warehouse staff integration

-- First, add the new columns
ALTER TABLE warehouse_order_activity 
ADD COLUMN warehouse VARCHAR(20) AFTER logistics,
ADD COLUMN processed_by VARCHAR(100) AFTER warehouse;

-- Remove phone_number column (if you want to keep existing data, skip this)
-- ALTER TABLE warehouse_order_activity DROP COLUMN phone_number;

-- Update the table structure to match new requirements
-- The table should now have:
-- - awb, order_ref, customer_name, product_name, logistics (auto-filled)
-- - warehouse, processed_by (dropdowns from warehousestaff_processed table)
-- - status, remarks (user input)

-- Create index for better performance
CREATE INDEX idx_warehouse ON warehouse_order_activity(warehouse);
CREATE INDEX idx_processed_by ON warehouse_order_activity(processed_by);

-- Sample data to test the new structure
INSERT INTO warehouse_order_activity (
    awb, order_ref, customer_name, product_name, logistics, 
    warehouse, processed_by, status, remarks, created_by
) VALUES 
(
    'TEST' + UNIX_TIMESTAMP(), 'ORD' + UNIX_TIMESTAMP(), 'Test Customer', 'Test Product', 'Delhivery',
    'MUM_WH', 'Abhishek', 'Dispatch', 
    'Test order with warehouse staff integration', 1
);

-- Show the updated structure
DESCRIBE warehouse_order_activity;