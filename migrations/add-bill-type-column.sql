-- Add bill_type column to existing bills table
ALTER TABLE bills 
ADD COLUMN bill_type ENUM('B2B', 'B2C') NOT NULL DEFAULT 'B2C' 
AFTER invoice_number;
