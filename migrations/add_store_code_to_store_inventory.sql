-- Add store_code column to store_inventory table
-- This enables multi-store inventory tracking

-- Step 1: Add the store_code column (allow NULL initially for existing data)
ALTER TABLE store_inventory 
ADD COLUMN store_code VARCHAR(50) NULL AFTER id;

-- Step 2: Set a default store code for existing records (update this based on your main store)
-- Replace 'MAIN_STORE' with your actual default store code
UPDATE store_inventory 
SET store_code = 'MAIN_STORE' 
WHERE store_code IS NULL;

-- Step 3: Make store_code NOT NULL after populating existing records
ALTER TABLE store_inventory 
MODIFY COLUMN store_code VARCHAR(50) NOT NULL;

-- Step 4: Add index for better query performance
ALTER TABLE store_inventory 
ADD INDEX idx_store_code (store_code);

-- Step 5: Add composite index for common queries (store + product)
ALTER TABLE store_inventory 
ADD INDEX idx_store_product (store_code, barcode);

-- Verify the changes
SHOW COLUMNS FROM store_inventory;
SHOW INDEX FROM store_inventory;
