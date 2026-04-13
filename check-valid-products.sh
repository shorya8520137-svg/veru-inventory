#!/bin/bash

echo "=========================================="
echo "Checking Valid Products in Database"
echo "=========================================="
echo ""

echo "Fetching first 10 products from database..."
sudo mysql inventory_db -e "SELECT product_id, product_name, category FROM products LIMIT 10;"

echo ""
echo "=========================================="
echo "Total products in database:"
sudo mysql inventory_db -e "SELECT COUNT(*) as total_products FROM products;"

echo ""
echo "=========================================="
echo "Use one of the product_id values above to test the review system."
echo ""
