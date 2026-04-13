#!/bin/bash

echo "=========================================="
echo "Analyzing Products Database Issue"
echo "=========================================="
echo ""

echo "1. Checking all tables in database..."
sudo mysql inventory_db -e "SHOW TABLES;"

echo ""
echo "2. Checking products table structure..."
sudo mysql inventory_db -e "DESCRIBE products;"

echo ""
echo "3. Counting products in products table..."
sudo mysql inventory_db -e "SELECT COUNT(*) as total_products FROM products;"

echo ""
echo "4. Showing all products..."
sudo mysql inventory_db -e "SELECT product_id, product_name, sku FROM products LIMIT 20;"

echo ""
echo "5. Checking for other product-related tables..."
sudo mysql inventory_db -e "SHOW TABLES LIKE '%product%';"

echo ""
echo "6. Checking website_order_items to see what product IDs are being used..."
sudo mysql inventory_db -e "SELECT DISTINCT product_id FROM website_order_items ORDER BY product_id;"

echo ""
echo "7. Checking if there's an inventory_products table..."
sudo mysql inventory_db -e "SELECT COUNT(*) FROM inventory_products;" 2>/dev/null || echo "No inventory_products table found"

echo ""
echo "8. Exporting database schema..."
mysqldump -u inventory_user -p --no-data inventory_db > /tmp/schema_only.sql 2>/dev/null || echo "Could not export schema"

echo ""
echo "=========================================="
echo "Analysis Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Check the output above to see which tables exist"
echo "- Look for tables with 'product' in the name"
echo "- The products table should have your Baby Pink Tumbler, etc."
echo ""
