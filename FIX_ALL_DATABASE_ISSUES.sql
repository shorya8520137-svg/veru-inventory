-- ============================================================================
-- COMPLETE DATABASE FIX FOR STORE INVENTORY SYSTEM
-- Run this script to fix all current database issues
-- ============================================================================

USE giftgala_inventory;

-- ============================================================================
-- FIX 1: Add 'internal_transfer' to payment_mode ENUM
-- ============================================================================
ALTER TABLE bills 
MODIFY COLUMN payment_mode ENUM('cash', 'upi', 'card', 'bank', 'internal_transfer') 
NOT NULL DEFAULT 'cash';

-- ============================================================================
-- FIX 2: Add 'completed' to payment_status ENUM
-- ============================================================================
ALTER TABLE bills 
MODIFY COLUMN payment_status ENUM('paid', 'partial', 'unpaid', 'completed') 
NOT NULL DEFAULT 'paid';

-- ============================================================================
-- FIX 3: Add store_code column to store_inventory table
-- ============================================================================

-- Add the column (allow NULL initially)
ALTER TABLE store_inventory 
ADD COLUMN IF NOT EXISTS store_code VARCHAR(50) NULL AFTER id;

-- Set default store code for existing records
-- IMPORTANT: Change 'MAIN_STORE' to your actual default store code
UPDATE store_inventory 
SET store_code = 'MAIN_STORE' 
WHERE store_code IS NULL;

-- Make store_code NOT NULL
ALTER TABLE store_inventory 
MODIFY COLUMN store_code VARCHAR(50) NOT NULL;

-- Add indexes for performance
ALTER TABLE store_inventory 
ADD INDEX IF NOT EXISTS idx_store_code (store_code);

ALTER TABLE store_inventory 
ADD INDEX IF NOT EXISTS idx_store_product (store_code, barcode);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify payment_mode ENUM
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'giftgala_inventory' 
  AND TABLE_NAME = 'bills' 
  AND COLUMN_NAME = 'payment_mode';

-- Verify payment_status ENUM
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'giftgala_inventory' 
  AND TABLE_NAME = 'bills' 
  AND COLUMN_NAME = 'payment_status';

-- Verify store_code column
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'giftgala_inventory' 
  AND TABLE_NAME = 'store_inventory' 
  AND COLUMN_NAME = 'store_code';

-- Show store_inventory indexes
SHOW INDEX FROM store_inventory;

-- Count records by store
SELECT store_code, COUNT(*) as product_count 
FROM store_inventory 
GROUP BY store_code;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
-- payment_mode: enum('cash','upi','card','bank','internal_transfer')
-- payment_status: enum('paid','partial','unpaid','completed')
-- store_code: varchar(50) NOT NULL
-- Indexes: idx_store_code, idx_store_product
-- ============================================================================
