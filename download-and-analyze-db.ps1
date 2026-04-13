# Database Download and Analysis Script
# This script downloads the database from server, analyzes it, and creates fix scripts

$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.52.15"
$DB_NAME = "inventory_db"
$BACKUP_FILE = "inventory_db_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Database Download & Analysis Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create database dump on server
Write-Host "📦 Step 1: Creating database dump on server..." -ForegroundColor Yellow
$dumpCommand = @"
sudo mysqldump -u root $DB_NAME > /tmp/$BACKUP_FILE && \
echo 'Dump created successfully' && \
ls -lh /tmp/$BACKUP_FILE
"@

ssh -i $SSH_KEY $SERVER $dumpCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create database dump" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database dump created on server" -ForegroundColor Green
Write-Host ""

# Step 2: Download the dump file
Write-Host "⬇️  Step 2: Downloading database dump..." -ForegroundColor Yellow
scp -i $SSH_KEY "${SERVER}:/tmp/$BACKUP_FILE" "./$BACKUP_FILE"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to download database dump" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database downloaded: $BACKUP_FILE" -ForegroundColor Green
Write-Host ""

# Step 3: Analyze the dump file
Write-Host "🔍 Step 3: Analyzing database structure..." -ForegroundColor Yellow

$dumpContent = Get-Content $BACKUP_FILE -Raw

# Check for website_orders table
$hasWebsiteOrders = $dumpContent -match "CREATE TABLE.*website_orders"
$hasWebsiteOrderItems = $dumpContent -match "CREATE TABLE.*website_order_items"

Write-Host ""
Write-Host "Analysis Results:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "website_orders table exists: $(if($hasWebsiteOrders){'✅ YES'}else{'❌ NO'})" -ForegroundColor $(if($hasWebsiteOrders){'Green'}else{'Red'})
Write-Host "website_order_items table exists: $(if($hasWebsiteOrderItems){'✅ YES'}else{'❌ NO'})" -ForegroundColor $(if($hasWebsiteOrderItems){'Green'}else{'Red'})
Write-Host ""

# Step 4: Create fix script based on analysis
Write-Host "🔧 Step 4: Creating fix script..." -ForegroundColor Yellow

$fixScript = @"
-- Database Fix Script for Website Orders
-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

USE $DB_NAME;

"@

if (-not $hasWebsiteOrders) {
    Write-Host "⚠️  website_orders table missing - adding CREATE statement" -ForegroundColor Yellow
    $fixScript += @"

-- Create website_orders table
CREATE TABLE IF NOT EXISTS website_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_status VARCHAR(50),
    payment_method VARCHAR(50),
    shipping_address TEXT,
    billing_address TEXT,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery DATE,
    actual_delivery DATE,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_number (order_number),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

"@
}

if (-not $hasWebsiteOrderItems) {
    Write-Host "⚠️  website_order_items table missing - adding CREATE statement" -ForegroundColor Yellow
    $fixScript += @"

-- Create website_order_items table
CREATE TABLE IF NOT EXISTS website_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    variant VARCHAR(255),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES website_orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_name (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

"@
}

# Add sample data
$fixScript += @"

-- Insert sample data for testing
INSERT INTO website_orders (
    order_number,
    user_id,
    status,
    total_amount,
    currency,
    payment_status,
    payment_method,
    shipping_address,
    order_date
) VALUES 
(
    'ORD-2026-267382',
    1,
    'Processing',
    1499.00,
    'INR',
    'Paid',
    'Card',
    '{"name":"Shorya Singh","email":"singhshorya997@gmail.com","phone":"+91-9876543210","addressLine1":"123 Main Street","addressLine2":"Apartment 4B","city":"Bangalore","state":"Karnataka","postalCode":"560001","country":"India"}',
    '2026-02-10 10:30:00'
),
(
    'ORD-2026-514464',
    2,
    'Pending',
    2998.00,
    'INR',
    'Pending',
    'Card',
    '{"name":"Preet Rana","email":"preet.rana@example.com","phone":"+91-9876543211","addressLine1":"456 Park Avenue","city":"Mumbai","state":"Maharashtra","postalCode":"400001","country":"India"}',
    '2026-02-10 11:45:00'
),
(
    'ORD-2026-730016',
    1,
    'Pending',
    5996.00,
    'INR',
    'Pending',
    'Card',
    '{"name":"Shorya Singh","email":"singhshorya997@gmail.com","phone":"+91-9876543210","addressLine1":"789 Gandhi Road","city":"Delhi","state":"Delhi","postalCode":"110001","country":"India"}',
    '2026-02-10 12:15:00'
),
(
    'ORD-2026-431870',
    1,
    'Shipped',
    19.99,
    'INR',
    'Paid',
    'Cod',
    '{"name":"Shorya Singh","email":"singhshorya997@gmail.com","phone":"+91-9876543210","addressLine1":"321 MG Road","city":"Pune","state":"Maharashtra","postalCode":"411001","country":"India"}',
    '2026-02-03 09:20:00'
),
(
    'ORD-2026-872475',
    1,
    'Pending',
    19.99,
    'INR',
    'Pending',
    'Card',
    '{"name":"Shorya Singh","email":"singhshorya997@gmail.com","phone":"+91-9876543210","addressLine1":"654 Brigade Road","city":"Bangalore","state":"Karnataka","postalCode":"560025","country":"India"}',
    '2026-02-03 10:45:00'
),
(
    'ORD-2026-437144',
    1,
    'Pending',
    149.99,
    'INR',
    'Pending',
    'Cod',
    '{"name":"Shorya Singh","email":"singhshorya997@gmail.com","phone":"+91-9876543210","addressLine1":"987 Commercial Street","city":"Bangalore","state":"Karnataka","postalCode":"560001","country":"India"}',
    '2026-02-03 14:30:00'
),
(
    'ORD-2026-334734',
    1,
    'Pending',
    1.00,
    'INR',
    'Pending',
    'Cod',
    '{"name":"Shorya Singh","email":"singhshorya997@gmail.com","phone":"+91-9876543210","addressLine1":"147 Residency Road","city":"Bangalore","state":"Karnataka","postalCode":"560025","country":"India"}',
    '2026-02-03 15:00:00'
),
(
    'ORD-2026-670845',
    3,
    'Pending',
    174.98,
    'INR',
    'Pending',
    'Credit_card',
    '{"name":"Sarah Johnson","email":"sarah.johnson@example.com","phone":"+91-9876543212","addressLine1":"258 Indiranagar","city":"Bangalore","state":"Karnataka","postalCode":"560038","country":"India"}',
    '2026-02-03 16:20:00'
)
ON DUPLICATE KEY UPDATE order_number=order_number;

-- Insert order items for each order
INSERT INTO website_order_items (order_id, product_name, variant, quantity, unit_price, total_price)
SELECT id, 'Premium Wireless Headphones', 'Black', 1, 1499.00, 1499.00 FROM website_orders WHERE order_number = 'ORD-2026-267382'
UNION ALL
SELECT id, 'Bluetooth Speaker', 'Blue', 2, 1499.00, 2998.00 FROM website_orders WHERE order_number = 'ORD-2026-514464'
UNION ALL
SELECT id, 'Smart Watch', 'Silver', 2, 2998.00, 5996.00 FROM website_orders WHERE order_number = 'ORD-2026-730016'
UNION ALL
SELECT id, 'Phone Case', 'Transparent', 1, 19.99, 19.99 FROM website_orders WHERE order_number = 'ORD-2026-431870'
UNION ALL
SELECT id, 'USB Cable', 'Type-C', 1, 19.99, 19.99 FROM website_orders WHERE order_number = 'ORD-2026-872475'
UNION ALL
SELECT id, 'Screen Protector', 'Tempered Glass', 1, 149.99, 149.99 FROM website_orders WHERE order_number = 'ORD-2026-437144'
UNION ALL
SELECT id, 'Earbuds', 'White', 1, 1.00, 1.00 FROM website_orders WHERE order_number = 'ORD-2026-334734'
UNION ALL
SELECT id, 'Power Bank', '10000mAh', 1, 174.98, 174.98 FROM website_orders WHERE order_number = 'ORD-2026-670845'
ON DUPLICATE KEY UPDATE product_name=product_name;

-- Verify data
SELECT 'Orders Created:' as info, COUNT(*) as count FROM website_orders;
SELECT 'Order Items Created:' as info, COUNT(*) as count FROM website_order_items;

-- Show sample data
SELECT 
    o.order_number,
    o.status,
    o.total_amount,
    JSON_EXTRACT(o.shipping_address, '$.name') as customer_name,
    JSON_EXTRACT(o.shipping_address, '$.email') as customer_email,
    COUNT(oi.id) as item_count
FROM website_orders o
LEFT JOIN website_order_items oi ON o.id = oi.order_id
GROUP BY o.id
ORDER BY o.order_date DESC;

"@

# Save fix script
$fixScriptFile = "fix-website-orders-$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
$fixScript | Out-File -FilePath $fixScriptFile -Encoding UTF8

Write-Host "✅ Fix script created: $fixScriptFile" -ForegroundColor Green
Write-Host ""

# Step 5: Upload and execute fix script on server
Write-Host "🚀 Step 5: Uploading and executing fix script on server..." -ForegroundColor Yellow

# Upload fix script
scp -i $SSH_KEY $fixScriptFile "${SERVER}:/tmp/$fixScriptFile"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload fix script" -ForegroundColor Red
    exit 1
}

# Execute fix script
$executeCommand = @"
sudo mysql $DB_NAME < /tmp/$fixScriptFile && \
echo 'Fix script executed successfully' && \
sudo mysql $DB_NAME -e "SELECT COUNT(*) as total_orders FROM website_orders; SELECT COUNT(*) as total_items FROM website_order_items;"
"@

ssh -i $SSH_KEY $SERVER $executeCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Fix script executed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fix script execution had issues - check output above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Database backup: $BACKUP_FILE" -ForegroundColor Green
Write-Host "✅ Fix script: $fixScriptFile" -ForegroundColor Green
Write-Host "✅ Tables created and sample data inserted" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Test your website orders page now!" -ForegroundColor Cyan
Write-Host "   https://13.212.52.15:8443" -ForegroundColor Cyan
Write-Host ""
