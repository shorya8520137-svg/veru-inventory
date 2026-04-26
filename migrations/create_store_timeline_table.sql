-- Create store_timeline table for tracking all inventory movements at stores
-- This table provides a complete audit trail of stock changes

CREATE TABLE IF NOT EXISTS store_timeline (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_code VARCHAR(100) NOT NULL COMMENT 'Store identifier',
  product_barcode VARCHAR(255) NOT NULL COMMENT 'Product barcode',
  product_name VARCHAR(255) COMMENT 'Product name for display',
  movement_type ENUM('OPENING', 'SELF_TRANSFER', 'DISPATCH', 'RETURN', 'DAMAGE', 'RECOVER', 'MANUAL') NOT NULL COMMENT 'Type of inventory movement',
  direction ENUM('IN', 'OUT') NOT NULL COMMENT 'Direction of movement (IN = stock increase, OUT = stock decrease)',
  quantity INT UNSIGNED NOT NULL COMMENT 'Quantity moved',
  balance_after INT UNSIGNED NOT NULL COMMENT 'Stock balance after this movement',
  reference VARCHAR(255) COMMENT 'Reference number (e.g., transfer ID, bill number)',
  user_id VARCHAR(255) COMMENT 'User who performed the action',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of the movement',
  
  -- Indexes for performance
  INDEX idx_store_product (store_code, product_barcode),
  INDEX idx_created_at (created_at),
  INDEX idx_reference (reference),
  INDEX idx_movement_type (movement_type),
  INDEX idx_direction (direction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Timeline of all inventory movements at stores for audit and tracking';

-- Add comments to columns for documentation
ALTER TABLE store_timeline 
  MODIFY COLUMN id BIGINT AUTO_INCREMENT COMMENT 'Unique timeline entry ID',
  MODIFY COLUMN store_code VARCHAR(100) NOT NULL COMMENT 'Store identifier (e.g., GURUGRAM-NH48)',
  MODIFY COLUMN product_barcode VARCHAR(255) NOT NULL COMMENT 'Product barcode for identification',
  MODIFY COLUMN product_name VARCHAR(255) COMMENT 'Product name for display purposes',
  MODIFY COLUMN movement_type ENUM('OPENING', 'SELF_TRANSFER', 'DISPATCH', 'RETURN', 'DAMAGE', 'RECOVER', 'MANUAL') NOT NULL COMMENT 'Type of inventory movement',
  MODIFY COLUMN direction ENUM('IN', 'OUT') NOT NULL COMMENT 'Direction: IN = stock increase, OUT = stock decrease',
  MODIFY COLUMN quantity INT UNSIGNED NOT NULL COMMENT 'Quantity moved in this transaction',
  MODIFY COLUMN balance_after INT UNSIGNED NOT NULL COMMENT 'Running balance after this movement',
  MODIFY COLUMN reference VARCHAR(255) COMMENT 'Reference number linking to source transaction',
  MODIFY COLUMN user_id VARCHAR(255) COMMENT 'User who initiated the movement',
  MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when movement occurred';
