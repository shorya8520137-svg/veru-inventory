-- Clear only dispatch_product table (regular products)
-- This will NOT affect website_products table
-- Run this with: sudo mysql inventory_db < clear-products-only.sql

USE inventory_db;

-- First, disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all data from dispatch_product table only
-- This is the main products table, NOT website products
TRUNCATE TABLE dispatch_product;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show confirmation
SELECT 'Products table cleared successfully!' AS Status;
SELECT COUNT(*) AS remaining_products FROM dispatch_product;
SELECT COUNT(*) AS website_products_intact FROM website_products;
