-- =====================================================
-- FIX WAREHOUSE AND STORE MANAGEMENT SYSTEM
-- =====================================================
-- This script works with existing warehouses and stores tables
-- and adds missing fields needed for the management system

-- 1. ADD MISSING FIELDS TO EXISTING WAREHOUSES TABLE
ALTER TABLE warehouses 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) AFTER address,
ADD COLUMN IF NOT EXISTS email VARCHAR(255) AFTER phone,
ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255) AFTER email,
ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 0 AFTER manager_name,
ADD COLUMN IF NOT EXISTS city VARCHAR(100) AFTER location,
ADD COLUMN IF NOT EXISTS state VARCHAR(100) AFTER city,
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India' AFTER state,
ADD COLUMN IF NOT EXISTS pincode VARCHAR(20) AFTER country;

-- 2. ADD MISSING FIELDS TO EXISTING STORES TABLE  
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS store_type ENUM('retail', 'wholesale', 'online', 'franchise') DEFAULT 'retail' AFTER store_name,
ADD COLUMN IF NOT EXISTS address TEXT AFTER store_type,
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India' AFTER state,
ADD COLUMN IF NOT EXISTS pincode VARCHAR(20) AFTER country,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) AFTER pincode,
ADD COLUMN IF NOT EXISTS email VARCHAR(255) AFTER phone,
ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255) AFTER email,
ADD COLUMN IF NOT EXISTS area_sqft INT DEFAULT 0 AFTER manager_name,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- 3. UPDATE EXISTING WAREHOUSE DATA WITH SAMPLE DETAILS
UPDATE warehouses SET 
    phone = '+91-9876543210',
    manager_name = 'Rajesh Kumar',
    capacity = 10000,
    city = 'Gurgaon',
    state = 'Haryana',
    pincode = '122015'
WHERE code = 'GGM_WH';

UPDATE warehouses SET 
    phone = '+91-9876543211',
    manager_name = 'Suresh Reddy',
    capacity = 8000,
    city = 'Bangalore',
    state = 'Karnataka',
    pincode = '560100'
WHERE code = 'BLR_WH';

UPDATE warehouses SET 
    phone = '+91-9876543212',
    manager_name = 'Amit Sharma',
    capacity = 12000,
    city = 'Mumbai',
    state = 'Maharashtra',
    pincode = '400069'
WHERE code = 'MUM_WH';

UPDATE warehouses SET 
    phone = '+91-9876543213',
    manager_name = 'Kiran Patel',
    capacity = 7000,
    city = 'Ahmedabad',
    state = 'Gujarat',
    pincode = '382330'
WHERE code = 'AMD_WH';

UPDATE warehouses SET 
    phone = '+91-9876543214',
    manager_name = 'Venkat Rao',
    capacity = 9000,
    city = 'Hyderabad',
    state = 'Telangana',
    pincode = '500081'
WHERE code = 'HYD_WH';

-- 4. UPDATE EXISTING STORE DATA WITH SAMPLE DETAILS
UPDATE stores SET 
    store_type = 'retail',
    address = 'MGF Metropolis Mall, MG Road',
    country = 'India',
    pincode = '122002',
    phone = '+91-9876543220',
    manager_name = 'Priya Sharma',
    area_sqft = 2000
WHERE store_code = 'GGM_MGF_MALL';

UPDATE stores SET 
    store_type = 'retail',
    address = 'NH-48, Sector 15',
    country = 'India',
    pincode = '122001',
    phone = '+91-9876543221',
    manager_name = 'Deepak Nair',
    area_sqft = 1500
WHERE store_code = 'GGM_NH48';

UPDATE stores SET 
    store_type = 'retail',
    address = 'Roshanpura Market',
    country = 'India',
    pincode = '122003',
    phone = '+91-9876543222',
    manager_name = 'Neha Joshi',
    area_sqft = 1200
WHERE store_code = 'GGM_ROSHANPURA';

UPDATE stores SET 
    store_type = 'retail',
    address = 'Brookefield, Marathalli',
    country = 'India',
    pincode = '560037',
    phone = '+91-9876543223',
    manager_name = 'Rohit Gupta',
    area_sqft = 1800
WHERE store_code = 'BLR_BROOKEFIELD';

UPDATE stores SET 
    store_type = 'retail',
    address = 'Experience Centre, Koramangala',
    country = 'India',
    pincode = '560095',
    phone = '+91-9876543224',
    manager_name = 'Lakshmi Iyer',
    area_sqft = 2500
WHERE store_code = 'BLR_HUNYHUNY';

-- 5. CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_warehouses_location ON warehouses(city, state);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(city, state);
CREATE INDEX IF NOT EXISTS idx_stores_type_active ON stores(store_type, is_active);

-- 6. SHOW UPDATED STRUCTURE
SELECT 'WAREHOUSES TABLE UPDATED' as status;
SELECT COUNT(*) as warehouse_count FROM warehouses;

SELECT 'STORES TABLE UPDATED' as status;
SELECT COUNT(*) as store_count FROM stores;

-- 7. SHOW SAMPLE DATA
SELECT 'SAMPLE WAREHOUSE DATA' as info;
SELECT code, name, city, state, manager_name, phone FROM warehouses LIMIT 3;

SELECT 'SAMPLE STORE DATA' as info;
SELECT store_code, store_name, store_type, city, state, manager_name, phone FROM stores LIMIT 3;