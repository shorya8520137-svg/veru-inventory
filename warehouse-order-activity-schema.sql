-- Warehouse Order Activity Table Schema
-- This table stores order activities submitted by end users with auto-filled and manual data

CREATE TABLE IF NOT EXISTS warehouse_order_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Auto-filled fields (from existing order data)
    awb VARCHAR(100) NOT NULL,
    order_ref VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    logistics VARCHAR(100) NOT NULL,
    
    -- User input fields
    phone_number VARCHAR(20) NOT NULL,
    signature_url VARCHAR(500), -- Path to uploaded signature file
    
    -- Status and remarks
    status ENUM('Dispatch', 'Cancel') NOT NULL DEFAULT 'Dispatch',
    remarks TEXT NOT NULL,
    
    -- System fields
    created_by INT, -- User ID who created this entry
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_awb (awb),
    INDEX idx_order_ref (order_ref),
    INDEX idx_customer (customer_name),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    -- Foreign key constraint (optional, if you have users table)
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add some sample data for testing
INSERT INTO warehouse_order_activity (
    awb, order_ref, customer_name, product_name, logistics, 
    phone_number, signature_url, status, remarks, created_by
) VALUES 
(
    'AWB123456789', 'ORD001', 'John Doe', 'Smartphone Case', 'Blue Dart',
    '+91-9876543210', '/uploads/signatures/signature_001.png', 'Dispatch', 
    'Order processed successfully and ready for dispatch', 1
),
(
    'AWB987654321', 'ORD002', 'Jane Smith', 'Laptop Charger', 'Ecom Express',
    '+91-8765432109', '/uploads/signatures/signature_002.png', 'Cancel', 
    'Customer requested cancellation due to change in requirements', 1
);