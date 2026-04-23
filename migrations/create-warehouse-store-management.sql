-- =====================================================
-- WAREHOUSE AND STORE MANAGEMENT SYSTEM
-- =====================================================

-- 1. WAREHOUSES TABLE - Master list of all warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_code VARCHAR(50) NOT NULL UNIQUE,
    warehouse_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    pincode VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    capacity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_warehouse_code (warehouse_code),
    INDEX idx_city (city),
    INDEX idx_state (state),
    INDEX idx_active (is_active)
);

-- 2. STORES TABLE - Master list of all stores
CREATE TABLE IF NOT EXISTS stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_code VARCHAR(50) NOT NULL UNIQUE,
    store_name VARCHAR(255) NOT NULL,
    store_type ENUM('retail', 'wholesale', 'online', 'franchise') DEFAULT 'retail',
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    pincode VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    area_sqft INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_store_code (store_code),
    INDEX idx_store_type (store_type),
    INDEX idx_city (city),
    INDEX idx_state (state),
    INDEX idx_active (is_active)
);

-- 3. Insert sample warehouses (if not exists)
INSERT IGNORE INTO warehouses (warehouse_code, warehouse_name, address, city, state, pincode, phone, manager_name) VALUES
('GGM_WH', 'Gurgaon Main Warehouse', 'Sector 18, Industrial Area', 'Gurgaon', 'Haryana', '122015', '+91-9876543210', 'Rajesh Kumar'),
('BLR_WH', 'Bangalore Warehouse', 'Electronic City Phase 1', 'Bangalore', 'Karnataka', '560100', '+91-9876543211', 'Suresh Reddy'),
('MUM_WH', 'Mumbai Warehouse', 'Andheri East Industrial Estate', 'Mumbai', 'Maharashtra', '400069', '+91-9876543212', 'Amit Sharma'),
('AMD_WH', 'Ahmedabad Warehouse', 'Naroda Industrial Area', 'Ahmedabad', 'Gujarat', '382330', '+91-9876543213', 'Kiran Patel'),
('HYD_WH', 'Hyderabad Warehouse', 'Hitec City', 'Hyderabad', 'Telangana', '500081', '+91-9876543214', 'Venkat Rao'),
('DEL_WH', 'Delhi Warehouse', 'Okhla Industrial Area', 'New Delhi', 'Delhi', '110020', '+91-9876543215', 'Manoj Singh'),
('CHN_WH', 'Chennai Warehouse', 'Ambattur Industrial Estate', 'Chennai', 'Tamil Nadu', '600058', '+91-9876543216', 'Ravi Kumar'),
('KOL_WH', 'Kolkata Warehouse', 'Salt Lake Sector V', 'Kolkata', 'West Bengal', '700091', '+91-9876543217', 'Debasis Roy');

-- 4. Insert sample stores (if not exists)
INSERT IGNORE INTO stores (store_code, store_name, store_type, address, city, state, pincode, phone, manager_name) VALUES
('GGM_ST01', 'Gurgaon Mall Store', 'retail', 'DLF Mall, MG Road', 'Gurgaon', 'Haryana', '122002', '+91-9876543220', 'Priya Sharma'),
('BLR_ST01', 'Bangalore Forum Store', 'retail', 'Forum Mall, Koramangala', 'Bangalore', 'Karnataka', '560095', '+91-9876543221', 'Deepak Nair'),
('MUM_ST01', 'Mumbai Phoenix Store', 'retail', 'Phoenix Mills, Lower Parel', 'Mumbai', 'Maharashtra', '400013', '+91-9876543222', 'Neha Joshi'),
('DEL_ST01', 'Delhi CP Store', 'retail', 'Connaught Place', 'New Delhi', 'Delhi', '110001', '+91-9876543223', 'Rohit Gupta'),
('CHN_ST01', 'Chennai Express Store', 'retail', 'Express Avenue Mall', 'Chennai', 'Tamil Nadu', '600002', '+91-9876543224', 'Lakshmi Iyer'),
('GGM_WS01', 'Gurgaon Wholesale Hub', 'wholesale', 'Udyog Vihar Phase 4', 'Gurgaon', 'Haryana', '122016', '+91-9876543225', 'Vikram Agarwal'),
('BLR_WS01', 'Bangalore Wholesale Center', 'wholesale', 'Peenya Industrial Area', 'Bangalore', 'Karnataka', '560058', '+91-9876543226', 'Ramesh Babu');

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warehouses_location ON warehouses(city, state);
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(city, state);
CREATE INDEX IF NOT EXISTS idx_stores_type_active ON stores(store_type, is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(is_active);

-- 6. Show created tables
SELECT 'WAREHOUSES TABLE CREATED' as status;
SELECT COUNT(*) as warehouse_count FROM warehouses;

SELECT 'STORES TABLE CREATED' as status;
SELECT COUNT(*) as store_count FROM stores;