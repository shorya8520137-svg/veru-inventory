-- Safely clear dispatch_product table and related inventory data
-- This will NOT affect website_products
-- Run with: sudo mysql inventory_db < clear-products-safe.sql

USE inventory_db;

-- Show current counts before deletion
SELECT 'BEFORE DELETION:' AS Info;
SELECT COUNT(*) AS dispatch_products FROM dispatch_product;
SELECT COUNT(*) AS website_products FROM website_products;
SELECT COUNT(*) AS warehouse_inventory FROM warehouse_inventory;
SELECT COUNT(*) AS store_inventory FROM store_inventory;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clear inventory related to dispatch_product
-- These tables store inventory quantities for products
DELETE FROM warehouse_inventory WHERE product_id IN (SELECT p_id FROM dispatch_product);
DELETE FROM store_inventory WHERE product_id IN (SELECT p_id FROM dispatch_product);

-- Clear the main products table
TRUNCATE TABLE dispatch_product;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show counts after deletion
SELECT 'AFTER DELETION:' AS Info;
SELECT COUNT(*) AS dispatch_products FROM dispatch_product;
SELECT COUNT(*) AS website_products FROM website_products;
SELECT COUNT(*) AS warehouse_inventory FROM warehouse_inventory;
SELECT COUNT(*) AS store_inventory FROM store_inventory;

SELECT 'Products cleared successfully! Website products are intact.' AS Status;
