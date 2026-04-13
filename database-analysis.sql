-- Complete Inventory Database Analysis
-- This script analyzes the database structure for manual in/out movements

-- 1. Show all tables in the database
SELECT 'DATABASE TABLES' as analysis_section;
SHOW TABLES;

-- 2. Analyze key inventory tables structure
SELECT 'PRODUCTS TABLE STRUCTURE' as analysis_section;
DESCRIBE products;

SELECT 'WAREHOUSE INVENTORY STRUCTURE' as analysis_section;
DESCRIBE warehouse_inventory;

SELECT 'WAREHOUSE DISPATCH STRUCTURE' as analysis_section;
DESCRIBE warehouse_dispatch;

SELECT 'WAREHOUSE DAMAGE STRUCTURE' as analysis_section;
DESCRIBE warehouse_damage;

SELECT 'WAREHOUSE RETURN STRUCTURE' as analysis_section;
DESCRIBE warehouse_return;

SELECT 'WAREHOUSE RECOVERY STRUCTURE' as analysis_section;
DESCRIBE warehouse_recovery;

-- 3. Get record counts for all key tables
SELECT 'TABLE RECORD COUNTS' as analysis_section;
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'warehouse_inventory', COUNT(*) FROM warehouse_inventory
UNION ALL
SELECT 'warehouse_dispatch', COUNT(*) FROM warehouse_dispatch
UNION ALL
SELECT 'warehouse_damage', COUNT(*) FROM warehouse_damage
UNION ALL
SELECT 'warehouse_return', COUNT(*) FROM warehouse_return
UNION ALL
SELECT 'warehouse_recovery', COUNT(*) FROM warehouse_recovery;

-- 4. Analyze warehouse stock distribution
SELECT 'WAREHOUSE STOCK DISTRIBUTION' as analysis_section;
SELECT 
    warehouse,
    COUNT(*) as product_count,
    SUM(current_stock) as total_stock,
    AVG(current_stock) as avg_stock,
    MAX(current_stock) as max_stock,
    MIN(current_stock) as min_stock
FROM warehouse_inventory 
GROUP BY warehouse
ORDER BY total_stock DESC;

-- 5. Analyze dispatch patterns by warehouse and status
SELECT 'DISPATCH PATTERNS' as analysis_section;
SELECT 
    warehouse,
    status,
    COUNT(*) as dispatch_count,
    SUM(qty) as total_qty,
    AVG(qty) as avg_qty
FROM warehouse_dispatch 
GROUP BY warehouse, status
ORDER BY warehouse, dispatch_count DESC;

-- 6. Check recent activity (last 30 days)
SELECT 'RECENT ACTIVITY SUMMARY' as analysis_section;
SELECT 
    'Recent Dispatches (30 days)' as activity_type,
    COUNT(*) as count
FROM warehouse_dispatch 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
UNION ALL
SELECT 
    'Recent Damages (30 days)',
    COUNT(*)
FROM warehouse_damage 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
UNION ALL
SELECT 
    'Recent Returns (30 days)',
    COUNT(*)
FROM warehouse_return 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 7. Show sample product data
SELECT 'SAMPLE PRODUCTS' as analysis_section;
SELECT 
    p_id,
    product_name,
    barcode,
    category,
    selling_price,
    cost_price
FROM products 
ORDER BY p_id
LIMIT 10;

-- 8. Show current inventory status
SELECT 'CURRENT INVENTORY STATUS' as analysis_section;
SELECT 
    wi.warehouse,
    p.product_name,
    p.barcode,
    wi.current_stock,
    wi.last_updated,
    p.selling_price
FROM warehouse_inventory wi
JOIN products p ON wi.p_id = p.p_id
WHERE wi.current_stock > 0
ORDER BY wi.current_stock DESC
LIMIT 15;

-- 9. Analyze inventory flow metrics
SELECT 'INVENTORY FLOW METRICS' as analysis_section;
SELECT 
    'Total Products' as metric,
    COUNT(*) as value
FROM products
UNION ALL
SELECT 
    'Total Warehouses',
    COUNT(DISTINCT warehouse)
FROM warehouse_inventory
UNION ALL
SELECT 
    'Products with Stock',
    COUNT(*)
FROM warehouse_inventory
WHERE current_stock > 0
UNION ALL
SELECT 
    'Out of Stock Items',
    COUNT(*)
FROM warehouse_inventory
WHERE current_stock = 0
UNION ALL
SELECT 
    'Total Stock Value (Selling Price)',
    ROUND(SUM(wi.current_stock * p.selling_price), 2)
FROM warehouse_inventory wi
JOIN products p ON wi.p_id = p.p_id
WHERE wi.current_stock > 0;

-- 10. Check for any movement/audit tables
SELECT 'MOVEMENT TRACKING TABLES' as analysis_section;
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'inventory_db' 
AND (TABLE_NAME LIKE '%movement%' 
     OR TABLE_NAME LIKE '%audit%' 
     OR TABLE_NAME LIKE '%log%'
     OR TABLE_NAME LIKE '%activity%')
ORDER BY TABLE_NAME;

-- 11. Show foreign key relationships
SELECT 'FOREIGN KEY RELATIONSHIPS' as analysis_section;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_SCHEMA = 'inventory_db'
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;