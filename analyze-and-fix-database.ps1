# Database Analysis and Fix Script
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.52.15"
$DB_NAME = "inventory_db"
$BACKUP_FILE = "database_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

Write-Host "========================================"
Write-Host "  Database Analysis & Fix Tool"
Write-Host "========================================"
Write-Host ""

# Step 1: Download database
Write-Host "Step 1: Downloading database from server..."
Write-Host "   Server: $SERVER"
Write-Host "   Database: $DB_NAME"
Write-Host ""

ssh -i $SSH_KEY $SERVER "sudo mysqldump -u root $DB_NAME" > $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Database downloaded: $BACKUP_FILE"
} else {
    Write-Host "   Failed to download database"
    exit 1
}

Write-Host ""

# Step 2: Analyze database
Write-Host "Step 2: Analyzing database structure..."

$dbContent = Get-Content $BACKUP_FILE -Raw

$hasWebsiteOrders = $dbContent -match "CREATE TABLE.*website_orders"
$hasWebsiteOrderItems = $dbContent -match "CREATE TABLE.*website_order_items"

Write-Host ""
Write-Host "   Analysis Results:"
Write-Host "   ================="

if ($hasWebsiteOrders) {
    Write-Host "   website_orders table EXISTS"
} else {
    Write-Host "   website_orders table MISSING"
}

if ($hasWebsiteOrderItems) {
    Write-Host "   website_order_items table EXISTS"
} else {
    Write-Host "   website_order_items table MISSING"
}

Write-Host ""

# Step 3: Create fix script
Write-Host "Step 3: Creating fix script..."

$fixScriptContent = "USE $DB_NAME;`n`n"

if (-not $hasWebsiteOrders) {
    $fixScriptContent += @"
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

"@
}

if (-not $hasWebsiteOrderItems) {
    $fixScriptContent += @"
CREATE TABLE IF NOT EXISTS website_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    variant VARCHAR(255),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES website_orders(id) ON DELETE CASCADE
);

"@
}

$fixScriptContent += @"
INSERT INTO website_orders (order_number, user_id, status, total_amount, currency, payment_status, payment_method, shipping_address, order_date) VALUES 
('ORD-2026-001', 1, 'Processing', 1499.00, 'INR', 'Paid', 'Card', '{\"name\":\"Shorya Singh\",\"email\":\"singhshorya997@gmail.com\",\"phone\":\"+91-9876543210\",\"addressLine1\":\"123 Main Street\",\"city\":\"Bangalore\",\"state\":\"Karnataka\",\"postalCode\":\"560001\",\"country\":\"India\"}', NOW()),
('ORD-2026-002', 1, 'Pending', 2998.00, 'INR', 'Pending', 'COD', '{\"name\":\"Preet Rana\",\"email\":\"preet@example.com\",\"phone\":\"+91-9876543211\",\"addressLine1\":\"456 Park Avenue\",\"city\":\"Mumbai\",\"state\":\"Maharashtra\",\"postalCode\":\"400001\",\"country\":\"India\"}', NOW());

SET @order1_id = (SELECT id FROM website_orders WHERE order_number = 'ORD-2026-001');
SET @order2_id = (SELECT id FROM website_orders WHERE order_number = 'ORD-2026-002');

INSERT INTO website_order_items (order_id, product_name, quantity, unit_price, total_price) VALUES
(@order1_id, 'Premium Wireless Headphones', 1, 1499.00, 1499.00),
(@order2_id, 'Bluetooth Speaker', 1, 1200.00, 1200.00),
(@order2_id, 'USB Cable - Type C', 3, 599.33, 1798.00);
"@

$fixScriptFile = "fix_website_orders.sql"
$fixScriptContent | Out-File -FilePath $fixScriptFile -Encoding UTF8

Write-Host "   Fix script created: $fixScriptFile"
Write-Host ""

# Step 4: Upload and execute
Write-Host "Step 4: Uploading and executing fix script..."

scp -i $SSH_KEY $fixScriptFile "${SERVER}:/tmp/$fixScriptFile"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Fix script uploaded"
} else {
    Write-Host "   Failed to upload"
    exit 1
}

ssh -i $SSH_KEY $SERVER "sudo mysql $DB_NAME < /tmp/$fixScriptFile"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Fix script executed successfully!"
} else {
    Write-Host "   Failed to execute fix script"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Database Fix Complete!"
Write-Host "========================================"
Write-Host ""
Write-Host "Files created:"
Write-Host "   - $BACKUP_FILE"
Write-Host "   - $fixScriptFile"
Write-Host ""
