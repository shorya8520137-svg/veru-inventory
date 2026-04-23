-- =====================================================
-- FIX WAREHOUSE AND STORE MANAGEMENT SYSTEM (SAFE VERSION)
-- =====================================================
-- This script works with existing warehouses and stores tables
-- and adds missing fields needed for the management system

-- 1. ADD MISSING FIELDS TO EXISTING WAREHOUSES TABLE (Safe method)
-- Check and add phone column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'warehouses' 
AND column_name = 'phone';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE warehouses ADD COLUMN phone VARCHAR(20) AFTER address', 
    'SELECT "phone column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add email column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'warehouses' 
AND column_name = 'email';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE warehouses ADD COLUMN email VARCHAR(255) AFTER phone', 
    'SELECT "email column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add manager_name column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'warehouses' 
AND column_name = 'manager_name';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE warehouses ADD COLUMN manager_name VARCHAR(255) AFTER email', 
    'SELECT "manager_name column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add capacity column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'warehouses' 
AND column_name = 'capacity';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE warehouses ADD COLUMN capacity INT DEFAULT 0 AFTER manager_name', 
    'SELECT "capacity column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add city column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'warehouses' 
AND column_name = 'city';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE warehouses ADD COLUMN city VARCHAR(100) AFTER location', 
    'SELECT "city column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add state column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'warehouses' 
AND column_name = 'state';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE warehouses ADD COLUMN state VARCHAR(100) AFTER city', 
    'SELECT "state column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add country column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'warehouses' 
AND column_name = 'country';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE warehouses ADD COLUMN country VARCHAR(100) DEFAULT "India" AFTER state', 
    'SELECT "country column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add pincode column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'warehouses' 
AND column_name = 'pincode';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE warehouses ADD COLUMN pincode VARCHAR(20) AFTER country', 
    'SELECT "pincode column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. ADD MISSING FIELDS TO EXISTING STORES TABLE
-- Check and add store_type column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'stores' 
AND column_name = 'store_type';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stores ADD COLUMN store_type ENUM("retail", "wholesale", "online", "franchise") DEFAULT "retail" AFTER store_name', 
    'SELECT "store_type column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add address column to stores
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'stores' 
AND column_name = 'address';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stores ADD COLUMN address TEXT AFTER store_type', 
    'SELECT "address column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add country column to stores
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'stores' 
AND column_name = 'country';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stores ADD COLUMN country VARCHAR(100) DEFAULT "India" AFTER state', 
    'SELECT "country column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add pincode column to stores
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'stores' 
AND column_name = 'pincode';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stores ADD COLUMN pincode VARCHAR(20) AFTER country', 
    'SELECT "pincode column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add phone column to stores
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'stores' 
AND column_name = 'phone';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stores ADD COLUMN phone VARCHAR(20) AFTER pincode', 
    'SELECT "phone column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add email column to stores
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'stores' 
AND column_name = 'email';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stores ADD COLUMN email VARCHAR(255) AFTER phone', 
    'SELECT "email column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add manager_name column to stores
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'stores' 
AND column_name = 'manager_name';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stores ADD COLUMN manager_name VARCHAR(255) AFTER email', 
    'SELECT "manager_name column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add area_sqft column to stores
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'stores' 
AND column_name = 'area_sqft';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stores ADD COLUMN area_sqft INT DEFAULT 0 AFTER manager_name', 
    'SELECT "area_sqft column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add updated_at column to stores
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
AND table_name = 'stores' 
AND column_name = 'updated_at';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stores ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at', 
    'SELECT "updated_at column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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

-- 5. SHOW RESULTS
SELECT 'WAREHOUSES TABLE UPDATED' as status;
SELECT COUNT(*) as warehouse_count FROM warehouses;

SELECT 'STORES TABLE UPDATED' as status;
SELECT COUNT(*) as store_count FROM stores;

-- 6. SHOW SAMPLE DATA
SELECT 'SAMPLE WAREHOUSE DATA' as info;
SELECT code, name, city, state, manager_name, phone FROM warehouses LIMIT 3;

SELECT 'SAMPLE STORE DATA' as info;
SELECT store_code, store_name, store_type, city, state, manager_name, phone FROM stores LIMIT 3;