-- COMPLETE INVENTORY DATABASE FLOW ANALYSIS
-- Based on actual tables found in inventory_db

-- 1. Analyze the main inventory table structure
SELECT 'INVENTORY TABLE STRUCTURE' as analysis_section;
DESCRIBE inventory;

-- 2. Analyze warehouse dispatch structure  
SELECT 'WAREHOUSE DISPATCH STRUCTURE' as analysis_section;
DESCRIBE warehouse_dispatch;

-- 3. Check for store inventory
SELECT 'STORE INVENTORY STRUCTURE' as analysis_section;
DESCRIBE storeinventory;

-- 4. Analyze returns structure
SELECT 'RETURNS STRUCTURE' as analysis_section;
DESCRIBE returns;

-- 5. Check damage recovery log
SELECT 'DAMAGE RECOVERY LOG STRUCTURE' as analysis_section;
DESCRIBE damage_recovery_log;

-- 6. Analyze self transfer structure
SELECT 'SELF TRANSFER STRUCTURE' as analysis_section;
DESCRIBE self_transfer;

-- 7. Check inventory adjustments
SELECT 'INVENTORY ADJUSTMENTS STRUCTURE' as analysis_section;
DESCRIBE inventory_adjustments;

-- 8. Analyze stock transactions
SELECT 'STOCK TRANSACTIONS STRUCTURE' as analysis_section;
DESCRIBE stock_transactions;

-- 9. Check inventory ledger
SELECT 'INVENTORY LEDGER STRUCTURE' as analysis_section;
DESCRIBE inventory_ledger_base;

-- 10. Get record counts for all inventory-related tables
SELECT 'INVENTORY TABLE RECORD COUNTS' as analysis_section;
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'storeinventory', COUNT(*) FROM storeinventory
UNION ALL
SELECT 'warehouse_dispatch', COUNT(*) FROM warehouse_dispatch
UNION ALL
SELECT 'returns', COUNT(*) FROM returns
UNION ALL
SELECT 'damage_recovery_log', COUNT(*) FROM damage_recovery_log
UNION ALL
SELECT 'self_transfer', COUNT(*) FROM self_transfer
UNION ALL
SELECT 'inventory_adjustments', COUNT(*) FROM inventory_adjustments
UNION ALL
SELECT 'stock_transactions', COUNT(*) FROM stock_transactions
UNION ALL
SELECT 'inventory_ledger_base', COUNT(*) FROM inventory_ledger_base;

-- 11. Analyze current inventory levels
SELECT 'CURRENT INVENTORY LEVELS' as analysis_section;
SELECT 
    p.product_name,
    p.sku,
    i.quantity,
    i.location,
    i.last_updated
FROM inventory i
JOIN products p ON i.product_id = p.product_id
WHERE i.quantity > 0
ORDER BY i.quantity DESC
LIMIT 15;

-- 12. Analyze store inventory distribution
SELECT 'STORE INVENTORY DISTRIBUTION' as analysis_section;
SELECT 
    store_name,
    COUNT(*) as product_count,
    SUM(quantity) as total_stock
FROM storeinventory
GROUP BY store_name
ORDER BY total_stock DESC;

-- 13. Analyze recent warehouse dispatches
SELECT 'RECENT WAREHOUSE DISPATCHES' as analysis_section;
SELECT 
    warehouse,
    status,
    COUNT(*) as dispatch_count,
    SUM(qty) as total_qty
FROM warehouse_dispatch
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY warehouse, status
ORDER BY dispatch_count DESC;

-- 14. Check inventory adjustment patterns
SELECT 'INVENTORY ADJUSTMENT PATTERNS' as analysis_section;
SELECT 
    adjustment_type,
    reason,
    COUNT(*) as adjustment_count,
    SUM(quantity_change) as total_change
FROM inventory_adjustments
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY adjustment_type, reason
ORDER BY adjustment_count DESC;

-- 15. Analyze stock transaction types
SELECT 'STOCK TRANSACTION TYPES' as analysis_section;
SELECT 
    transaction_type,
    COUNT(*) as transaction_count,
    SUM(quantity) as total_quantity
FROM stock_transactions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY transaction_type
ORDER BY transaction_count DESC;

-- 16. Check return patterns
SELECT 'RETURN PATTERNS' as analysis_section;
SELECT 
    return_reason,
    status,
    COUNT(*) as return_count,
    SUM(quantity) as total_returned
FROM returns
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY return_reason, status
ORDER BY return_count DESC;

-- 17. Analyze damage recovery
SELECT 'DAMAGE RECOVERY ANALYSIS' as analysis_section;
SELECT 
    damage_type,
    recovery_status,
    COUNT(*) as damage_count,
    SUM(quantity_damaged) as total_damaged,
    SUM(quantity_recovered) as total_recovered
FROM damage_recovery_log
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY damage_type, recovery_status
ORDER BY damage_count DESC;

-- 18. Check self transfer activity
SELECT 'SELF TRANSFER ACTIVITY' as analysis_section;
SELECT 
    from_location,
    to_location,
    status,
    COUNT(*) as transfer_count,
    SUM(quantity) as total_transferred
FROM self_transfer
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY from_location, to_location, status
ORDER BY transfer_count DESC;

-- 19. Inventory flow summary metrics
SELECT 'INVENTORY FLOW SUMMARY' as analysis_section;
SELECT 
    'Total Products' as metric,
    COUNT(*) as value
FROM products
UNION ALL
SELECT 
    'Products in Inventory',
    COUNT(DISTINCT product_id)
FROM inventory
WHERE quantity > 0
UNION ALL
SELECT 
    'Total Inventory Quantity',
    SUM(quantity)
FROM inventory
UNION ALL
SELECT 
    'Active Stores',
    COUNT(DISTINCT store_name)
FROM storeinventory
UNION ALL
SELECT 
    'Recent Dispatches (30 days)',
    COUNT(*)
FROM warehouse_dispatch
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
UNION ALL
SELECT 
    'Recent Adjustments (30 days)',
    COUNT(*)
FROM inventory_adjustments
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 20. Manual movement opportunities analysis
SELECT 'MANUAL MOVEMENT OPPORTUNITIES' as analysis_section;
SELECT 
    'inventory_adjustments' as table_name,
    'Manual stock adjustments (in/out)' as purpose,
    'adjustment_type, quantity_change, reason' as key_fields
UNION ALL
SELECT 
    'stock_transactions',
    'Track all stock movements',
    'transaction_type, quantity, product_id'
UNION ALL
SELECT 
    'self_transfer',
    'Internal location transfers',
    'from_location, to_location, quantity'
UNION ALL
SELECT 
    'warehouse_dispatch',
    'Outbound movements',
    'warehouse, qty, status'
UNION ALL
SELECT 
    'returns',
    'Return processing',
    'return_reason, quantity, status'
UNION ALL
SELECT 
    'damage_recovery_log',
    'Damage tracking and recovery',
    'damage_type, quantity_damaged, quantity_recovered';