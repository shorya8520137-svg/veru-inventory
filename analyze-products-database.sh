#!/bin/bash
# Bash script to analyze database and find product data
# Run this on the server: bash analyze-products-database.sh

echo "=== Analyzing Database for Product Data ==="
echo ""

echo "=== TABLES WITH PRODUCT IN NAME ==="
sudo mysql inventory_db -e "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'inventory_db' AND TABLE_NAME LIKE '%product%' ORDER BY TABLE_NAME;"

echo ""
echo "=== WEBSITE_PRODUCTS TABLE COUNT ==="
sudo mysql inventory_db -e "SELECT COUNT(*) as total_products FROM website_products;"

echo ""
echo "=== WEBSITE_PRODUCTS TABLE SAMPLE ==="
sudo mysql inventory_db -e "SELECT id, product_name, sku, price, stock_quantity, is_active FROM website_products ORDER BY id DESC LIMIT 10;"

echo ""
echo "=== PRODUCTS TABLE COUNT ==="
sudo mysql inventory_db -e "SELECT COUNT(*) as total_products FROM products;"

echo ""
echo "=== PRODUCTS TABLE SAMPLE ==="
sudo mysql inventory_db -e "SELECT product_id, product_name, sku, price, stock FROM products ORDER BY product_id DESC LIMIT 10;"

echo ""
echo "=== PRODUCT IDs IN ORDER ITEMS ==="
sudo mysql inventory_db -e "SELECT DISTINCT oi.product_id, COUNT(*) as order_count FROM website_order_items oi GROUP BY oi.product_id ORDER BY oi.product_id;"

echo ""
echo "=== MATCHING WITH WEBSITE_PRODUCTS ==="
sudo mysql inventory_db -e "SELECT oi.product_id as order_product_id, wp.id as website_product_id, wp.product_name, wp.sku FROM website_order_items oi LEFT JOIN website_products wp ON oi.product_id = wp.id GROUP BY oi.product_id LIMIT 20;"

echo ""
echo "=== MATCHING WITH PRODUCTS TABLE ==="
sudo mysql inventory_db -e "SELECT oi.product_id as order_product_id, p.product_id as products_table_id, p.product_name, p.sku FROM website_order_items oi LEFT JOIN products p ON oi.product_id = p.product_id GROUP BY oi.product_id LIMIT 20;"

echo ""
echo "=== CHECKING WEBSITE_ORDER_ITEMS STRUCTURE ==="
sudo mysql inventory_db -e "DESCRIBE website_order_items;"

echo ""
echo "=== SAMPLE ORDER ITEMS WITH ALL FIELDS ==="
sudo mysql inventory_db -e "SELECT * FROM website_order_items LIMIT 5;"

echo ""
echo "=== Analysis Complete ==="
echo ""
echo "Next steps based on results:"
echo "1. If website_products has data -> Update backend to use website_products table"
echo "2. If products table has data -> Check product_id column name"
echo "3. If website_order_items has product_name column -> Use that directly"
echo ""
