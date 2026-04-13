@echo off
echo 🔧 Setting up Website Orders Database Tables...
echo Using sudo mysql to create tables...

REM Create the website orders tables using mysql
mysql -u root -p -e "USE inventory_db; CREATE TABLE IF NOT EXISTS website_orders (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255) NOT NULL, order_number VARCHAR(50) UNIQUE NOT NULL, status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending', total_amount DECIMAL(10,2) NOT NULL, currency VARCHAR(3) DEFAULT 'USD', payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending', payment_method VARCHAR(50), shipping_address JSON NOT NULL, billing_address JSON NOT NULL, order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, estimated_delivery DATE, actual_delivery DATE, tracking_number VARCHAR(100), notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_user_id (user_id), INDEX idx_status (status), INDEX idx_order_date (order_date), INDEX idx_order_number (order_number)); CREATE TABLE IF NOT EXISTS website_order_items (id VARCHAR(255) PRIMARY KEY, order_id VARCHAR(255) NOT NULL, product_id VARCHAR(255) NOT NULL, product_name VARCHAR(255) NOT NULL, product_image VARCHAR(500), quantity INT NOT NULL, unit_price DECIMAL(10,2) NOT NULL, total_price DECIMAL(10,2) NOT NULL, customization JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (order_id) REFERENCES website_orders(id) ON DELETE CASCADE, INDEX idx_order_id (order_id), INDEX idx_product_id (product_id)); SELECT 'Website Orders Database Setup Complete!' as Status;"

if %errorlevel% equ 0 (
    echo ✅ Website orders database tables created successfully!
    echo 📋 Tables created:
    echo    - website_orders
    echo    - website_order_items
    echo.
    echo 🎉 Setup complete! You can now test the order API.
) else (
    echo ❌ Failed to create database tables
    echo 💡 Make sure MySQL is running and you have the correct credentials
)