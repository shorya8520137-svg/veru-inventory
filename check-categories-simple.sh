#!/bin/bash
# Simple script to check product categories
# Run this on the server directly

echo "🔍 Checking Product Categories..."
echo ""

echo "📦 Recent Products and Their Categories:"
sudo mysql inventory_db -e "
SELECT 
    p.p_id,
    p.product_name,
    p.barcode,
    p.category_id,
    c.name AS category_name,
    c.display_name AS category_display_name
FROM dispatch_product p
LEFT JOIN product_categories c ON p.category_id = c.id
WHERE p.is_active = 1
ORDER BY p.created_at DESC
LIMIT 10;
"

echo ""
echo "📂 All Categories:"
sudo mysql inventory_db -e "
SELECT 
    id,
    name,
    display_name,
    is_active
FROM product_categories
ORDER BY name;
"

echo ""
echo "📊 Products Count by Category:"
sudo mysql inventory_db -e "
SELECT 
    COALESCE(c.display_name, 'UNCATEGORIZED') AS category,
    COUNT(*) AS product_count
FROM dispatch_product p
LEFT JOIN product_categories c ON p.category_id = c.id
WHERE p.is_active = 1
GROUP BY c.display_name
ORDER BY product_count DESC;
"

echo ""
echo "✅ Check complete!"
