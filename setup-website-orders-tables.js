const db = require('./db/connection');

console.log('Setting up website orders database tables...');

// Create website_orders table
const createOrdersTable = `
CREATE TABLE IF NOT EXISTS website_orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    shipping_address JSON NOT NULL,
    billing_address JSON NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery DATE,
    actual_delivery DATE,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date),
    INDEX idx_order_number (order_number)
);
`;

// Create website_order_items table
const createOrderItemsTable = `
CREATE TABLE IF NOT EXISTS website_order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    customization JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES website_orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);
`;

// Create additional indexes
const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON website_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON website_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON website_order_items(order_id, product_id);
`;

// Execute table creation
db.query(createOrdersTable, (err, result) => {
    if (err) {
        console.error('❌ Error creating website_orders table:', err.message);
    } else {
        console.log('✅ website_orders table created successfully');
        
        // Create order items table
        db.query(createOrderItemsTable, (err, result) => {
            if (err) {
                console.error('❌ Error creating website_order_items table:', err.message);
            } else {
                console.log('✅ website_order_items table created successfully');
                
                // Create indexes
                db.query(createIndexes, (err, result) => {
                    if (err) {
                        console.error('❌ Error creating indexes:', err.message);
                    } else {
                        console.log('✅ Database indexes created successfully');
                    }
                    
                    console.log('\n🎉 Website orders database setup completed!');
                    console.log('Tables created:');
                    console.log('- website_orders');
                    console.log('- website_order_items');
                    
                    process.exit(0);
                });
            }
        });
    }
});