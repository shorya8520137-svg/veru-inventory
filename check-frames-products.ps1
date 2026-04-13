# Check and fix frames category products

Write-Host "Checking frames category and products..." -ForegroundColor Cyan

# Load environment variables
$envFile = ".env.production"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            $key = $matches[1]
            $value = $matches[2] -replace '^["'']|["'']$'
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

Write-Host "`nDatabase: $DB_NAME on $DB_HOST" -ForegroundColor Yellow

# SQL queries to check the issue
$queries = @"
-- 1. Check if frames category exists
SELECT id, name, slug, parent_id FROM website_categories WHERE slug = 'frames';

-- 2. Check all categories
SELECT id, name, slug, parent_id FROM website_categories ORDER BY id;

-- 3. Check products in frames category (by category_id)
SELECT p.id, p.product_name, p.category_id, p.is_active, p.stock_quantity, c.name as category_name, c.slug
FROM website_products p
LEFT JOIN website_categories c ON p.category_id = c.id
WHERE c.slug = 'frames';

-- 4. Check all products with their categories
SELECT p.id, p.product_name, p.category_id, p.is_active, p.stock_quantity, c.name as category_name, c.slug
FROM website_products p
LEFT JOIN website_categories c ON p.category_id = c.id
ORDER BY p.id
LIMIT 20;

-- 5. Count products by category
SELECT c.name, c.slug, COUNT(p.id) as product_count
FROM website_categories c
LEFT JOIN website_products p ON c.id = p.category_id AND p.is_active = 1
GROUP BY c.id, c.name, c.slug
ORDER BY product_count DESC;
"@

# Save queries to temp file
$queries | Out-File -FilePath "temp_check_frames.sql" -Encoding UTF8

Write-Host "`nExecuting diagnostic queries..." -ForegroundColor Cyan

# Execute queries
mysql -h $DB_HOST -u $DB_USER -p"$DB_PASSWORD" $DB_NAME < temp_check_frames.sql

# Clean up
Remove-Item "temp_check_frames.sql" -ErrorAction SilentlyContinue

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Green
Write-Host "Based on the results above:"
Write-Host "1. If 'frames' category doesn't exist, we need to create it"
Write-Host "2. If products exist but category_id is wrong, we need to update them"
Write-Host "3. If products are inactive (is_active=0), we need to activate them"
Write-Host "4. If no products exist, we need to add some sample products"
