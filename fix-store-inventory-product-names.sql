-- Fix Store Inventory Product Names
-- Update store_inventory table to use actual product names from dispatch_product table

-- Update product names where they are currently showing barcode or "Transferred"
UPDATE store_inventory si
JOIN dispatch_product dp ON si.barcode COLLATE utf8mb4_unicode_ci = dp.barcode COLLATE utf8mb4_unicode_ci
SET si.product_name = dp.product_name
WHERE si.product_name = si.barcode 
   OR si.product_name = 'Transferred'
   OR si.product_name IS NULL
   OR si.product_name = '';

-- Update categories as well
UPDATE store_inventory si
JOIN dispatch_product dp ON si.barcode COLLATE utf8mb4_unicode_ci = dp.barcode COLLATE utf8mb4_unicode_ci
JOIN product_categories pc ON dp.category_id = pc.id
SET si.category = pc.name
WHERE si.category = 'Transferred'
   OR si.category IS NULL
   OR si.category = '';

-- Show results
SELECT 
    barcode,
    product_name,
    category,
    stock,
    'FIXED' as status
FROM store_inventory 
WHERE barcode IN ('2005-999')
ORDER BY product_name;