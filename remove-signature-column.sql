-- Remove signature_url column from warehouse_order_activity table
-- This will save server storage space by removing unnecessary file upload functionality

-- Step 1: Check if the table exists and show current structure
DESCRIBE warehouse_order_activity;

-- Step 2: Remove the signature_url column
ALTER TABLE warehouse_order_activity 
DROP COLUMN signature_url;

-- Step 3: Verify the column has been removed
DESCRIBE warehouse_order_activity;

-- Step 4: Clean up any existing signature files directory (optional)
-- Note: This SQL command won't work, you need to run this manually on the server:
-- rm -rf public/uploads/signatures/

-- Step 5: Show the updated table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'inventory_system' 
  AND TABLE_NAME = 'warehouse_order_activity'
ORDER BY ORDINAL_POSITION;