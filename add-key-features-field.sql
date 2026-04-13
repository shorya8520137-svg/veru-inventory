-- Add key_features field to website_products table
ALTER TABLE website_products 
ADD COLUMN key_features TEXT AFTER description;

-- Update existing products with empty JSON array if needed
UPDATE website_products 
SET key_features = '[]' 
WHERE key_features IS NULL;
