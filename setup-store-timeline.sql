-- ============================================
-- STORE TIMELINE SETUP SCRIPT
-- This script will:
-- 1. Create store_timeline table if not exists
-- 2. Populate it with existing transfer data
-- ============================================

-- Step 1: Create store_timeline table
CREATE TABLE IF NOT EXISTS store_timeline (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_code VARCHAR(100) NOT NULL COMMENT 'Store identifier',
  product_barcode VARCHAR(255) NOT NULL COMMENT 'Product barcode',
  product_name VARCHAR(255) COMMENT 'Product name for display',
  movement_type ENUM('OPENING', 'SELF_TRANSFER', 'DISPATCH', 'RETURN', 'DAMAGE', 'RECOVER', 'MANUAL') NOT NULL COMMENT 'Type of inventory movement',
  direction ENUM('IN', 'OUT') NOT NULL COMMENT 'Direction of movement',
  quantity INT UNSIGNED NOT NULL COMMENT 'Quantity moved',
  balance_after INT UNSIGNED NOT NULL COMMENT 'Stock balance after this movement',
  reference VARCHAR(255) COMMENT 'Reference number',
  user_id VARCHAR(255) COMMENT 'User who performed the action',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of the movement',
  
  INDEX idx_store_product (store_code, product_barcode),
  INDEX idx_created_at (created_at),
  INDEX idx_reference (reference),
  INDEX idx_movement_type (movement_type),
  INDEX idx_direction (direction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Timeline of all inventory movements at stores';

-- Step 2: Check if table was created
SELECT 'store_timeline table created/verified' as status;

-- Step 3: Populate timeline from existing store_inventory data
-- This creates OPENING entries for existing stock
INSERT INTO store_timeline (
    store_code,
    product_barcode,
    product_name,
    movement_type,
    direction,
    quantity,
    balance_after,
    reference,
    user_id,
    created_at
)
SELECT 
    'STORE_DEFAULT' as store_code,
    barcode as product_barcode,
    product_name,
    'OPENING' as movement_type,
    'IN' as direction,
    stock as quantity,
    stock as balance_after,
    'INITIAL_STOCK' as reference,
    'system' as user_id,
    created_at
FROM store_inventory
WHERE stock > 0
AND NOT EXISTS (
    SELECT 1 FROM store_timeline st 
    WHERE st.product_barcode = store_inventory.barcode 
    AND st.movement_type = 'OPENING'
)
LIMIT 1000;

-- Step 4: Show summary
SELECT 
    'Timeline entries created' as status,
    COUNT(*) as total_entries,
    SUM(CASE WHEN movement_type = 'OPENING' THEN 1 ELSE 0 END) as opening_entries,
    SUM(CASE WHEN movement_type = 'SELF_TRANSFER' THEN 1 ELSE 0 END) as transfer_entries
FROM store_timeline;

-- Step 5: Show sample data
SELECT 
    id,
    store_code,
    product_name,
    product_barcode,
    movement_type,
    direction,
    quantity,
    balance_after,
    created_at
FROM store_timeline
ORDER BY created_at DESC
LIMIT 10;
