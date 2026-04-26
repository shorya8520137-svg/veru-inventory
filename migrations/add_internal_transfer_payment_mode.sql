-- Add 'internal_transfer' to payment_mode ENUM in bills table
-- Add 'completed' to payment_status ENUM in bills table
-- This allows store-to-store transfers to be recorded with proper payment mode and status

-- Fix payment_mode ENUM
ALTER TABLE bills 
MODIFY COLUMN payment_mode ENUM('cash', 'upi', 'card', 'bank', 'internal_transfer') 
NOT NULL DEFAULT 'cash';

-- Fix payment_status ENUM
ALTER TABLE bills 
MODIFY COLUMN payment_status ENUM('paid', 'partial', 'unpaid', 'completed') 
NOT NULL DEFAULT 'paid';

-- Verify the changes
SHOW COLUMNS FROM bills LIKE 'payment_mode';
SHOW COLUMNS FROM bills LIKE 'payment_status';
