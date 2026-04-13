# PowerShell script to analyze database and find product data
# Run this script to identify where products are stored

$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.51.226"

Write-Host "=== Analyzing Database for Product Data ===" -ForegroundColor Cyan
Write-Host ""

# Create SQL analysis script
$SQL_SCRIPT = @"
-- Find all tables with 'product' in the name
SELECT TABLE_NAME, TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'inventory_db' 
AND TABLE_NAME LIKE '%product%'
ORDER BY TABLE_NAME;

-- Check website_products table
SELECT COUNT(*) as total_products FROM website_products;
SELECT id, product_name, sku, price, stock_quantity, is_active 
FROM website_products 
ORDER BY id DESC LIMIT 10;

-- Check products table
SELECT COUNT(*) as total_products FROM products;
SELECT product_id, product_name, sku, price, stock 
FROM products 
ORDER BY product_id DESC LIMIT 10;

-- Check if there's an inventory_products table
SELECT COUNT(*) as total FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'inventory_db' 
AND TABLE_NAME = 'inventory_products';

-- Check website_order_items to see what product IDs are being used
SELECT DISTINCT oi.product_id, COUNT(*) as order_count
FROM website_order_items oi
GROUP BY oi.product_id
ORDER BY oi.product_id;

-- Try to find products in website_products that match order items
SELECT 
    oi.product_id as order_product_id,
    wp.id as website_product_id,
    wp.product_name,
    wp.sku
FROM website_order_items oi
LEFT JOIN website_products wp ON oi.product_id = wp.id
GROUP BY oi.product_id
LIMIT 20;

-- Check if product_id in website_order_items matches products.product_id
SELECT 
    oi.product_id as order_product_id,
    p.product_id as products_table_id,
    p.product_name,
    p.sku
FROM website_order_items oi
LEFT JOIN products p ON oi.product_id = p.product_id
GROUP BY oi.product_id
LIMIT 20;
"@

Write-Host "Creating SQL analysis script on server..." -ForegroundColor Yellow
$SQL_SCRIPT | ssh -i $SSH_KEY $SERVER "cat > /tmp/analyze_products.sql"

Write-Host ""
Write-Host "Running database analysis..." -ForegroundColor Yellow
Write-Host ""

# Run the analysis
ssh -i $SSH_KEY $SERVER @"
echo '=== TABLES WITH PRODUCT IN NAME ==='
sudo mysql inventory_db -e "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'inventory_db' AND TABLE_NAME LIKE '%product%' ORDER BY TABLE_NAME;"

echo ''
echo '=== WEBSITE_PRODUCTS TABLE COUNT ==='
sudo mysql inventory_db -e "SELECT COUNT(*) as total_products FROM website_products;"

echo ''
echo '=== WEBSITE_PRODUCTS TABLE SAMPLE ==='
sudo mysql inventory_db -e "SELECT id, product_name, sku, price, stock_quantity, is_active FROM website_products ORDER BY id DESC LIMIT 10;"

echo ''
echo '=== PRODUCTS TABLE COUNT ==='
sudo mysql inventory_db -e "SELECT COUNT(*) as total_products FROM products;"

echo ''
echo '=== PRODUCTS TABLE SAMPLE ==='
sudo mysql inventory_db -e "SELECT product_id, product_name, sku, price, stock FROM products ORDER BY product_id DESC LIMIT 10;"

echo ''
echo '=== PRODUCT IDs IN ORDER ITEMS ==='
sudo mysql inventory_db -e "SELECT DISTINCT oi.product_id, COUNT(*) as order_count FROM website_order_items oi GROUP BY oi.product_id ORDER BY oi.product_id;"

echo ''
echo '=== MATCHING WITH WEBSITE_PRODUCTS ==='
sudo mysql inventory_db -e "SELECT oi.product_id as order_product_id, wp.id as website_product_id, wp.product_name, wp.sku FROM website_order_items oi LEFT JOIN website_products wp ON oi.product_id = wp.id GROUP BY oi.product_id LIMIT 20;"

echo ''
echo '=== MATCHING WITH PRODUCTS TABLE ==='
sudo mysql inventory_db -e "SELECT oi.product_id as order_product_id, p.product_id as products_table_id, p.product_name, p.sku FROM website_order_items oi LEFT JOIN products p ON oi.product_id = p.product_id GROUP BY oi.product_id LIMIT 20;"

echo ''
echo '=== CHECKING WEBSITE_ORDER_ITEMS STRUCTURE ==='
sudo mysql inventory_db -e "DESCRIBE website_order_items;"

echo ''
echo '=== SAMPLE ORDER ITEMS WITH ALL FIELDS ==='
sudo mysql inventory_db -e "SELECT * FROM website_order_items LIMIT 5;"
"@

Write-Host ""
Write-Host "=== Analysis Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps based on results:" -ForegroundColor Cyan
Write-Host "1. If website_products has data -> Update backend to use website_products table"
Write-Host "2. If products table has data -> Check product_id column name"
Write-Host "3. If website_order_items has product_name column -> Use that directly"
Write-Host ""
