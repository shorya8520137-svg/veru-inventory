-- Fix source_type column in stock_batches table for bulk upload
-- This fixes the "Data truncated for column 'source_type'" error

-- First, check if column exists and drop it if it has wrong type
ALTER TABLE stock_batches 
DROP COLUMN IF EXISTS source_type;

-- Add source_type column with correct type
ALTER TABLE stock_batches 
ADD COLUMN source_type VARCHAR(50) DEFAULT NULL AFTER warehouse;

-- Update existing records to have a default source type
UPDATE stock_batches 
SET source_type = 'OPENING' 
WHERE source_type IS NULL;

-- Verify the change
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'stock_batches' 
AND COLUMN_NAME = 'source_type';
