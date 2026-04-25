-- Check products and their categories
SELECT 
    p.p_id,
    p.product_name,
    p.barcode,
    p.category_id,
    c.name AS category_name,
    c.display_name AS category_display_name,
    c.is_active AS category_is_active
FROM dispatch_product p
LEFT JOIN product_categories c ON p.category_id = c.id
WHERE p.is_active = 1
ORDER BY p.created_at DESC
LIMIT 10;

-- Check all categories
SELECT 
    id,
    name,
    display_name,
    description,
    is_active
FROM product_categories
ORDER BY name;

-- Count products by category
SELECT 
    COALESCE(c.display_name, 'UNCATEGORIZED') AS category,
    COUNT(*) AS product_count
FROM dispatch_product p
LEFT JOIN product_categories c ON p.category_id = c.id
WHERE p.is_active = 1
GROUP BY c.display_name
ORDER BY product_count DESC;
