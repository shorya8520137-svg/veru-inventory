-- Clean Store Inventory and Fix Product Names
-- Run these commands manually via SSH

-- 1. Clear all dummy data from store inventory
DELETE FROM store_inventory;

-- 2. Update warehouse inventory with proper product names
UPDATE inventory SET product = 'Samsung Galaxy S24' WHERE code = '2025-885';
UPDATE inventory SET product = 'iPhone 15 Pro Max' WHERE code = '2460-3499';
UPDATE inventory SET product = 'MacBook Air M3' WHERE code = '493-11471';
UPDATE inventory SET product = 'Dell XPS 13' WHERE code = '638-30500';

-- 3. Clear any existing bills (optional)
DELETE FROM bills WHERE invoice_number LIKE 'TRF_%';

-- 4. Clear any test transfers (optional)
DELETE FROM self_transfer WHERE transfer_reference LIKE 'TEST_%';
DELETE FROM self_transfer_items WHERE transfer_id NOT IN (SELECT id FROM self_transfer);

-- 5. Verify the changes
SELECT 'Warehouse Products:' as info;
SELECT product, code, stock, warehouse FROM inventory WHERE stock > 0;

SELECT 'Store Inventory Count:' as info;
SELECT COUNT(*) as count FROM store_inventory;

SELECT 'Ready for testing!' as status;