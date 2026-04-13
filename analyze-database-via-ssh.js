#!/usr/bin/env node

// Script to analyze inventory database via SSH tunnel
const { spawn } = require('child_process');
const fs = require('fs');

async function analyzeDatabase() {
    console.log('🔍 ANALYZING INVENTORY DATABASE STRUCTURE');
    console.log('=' .repeat(60));
    
    // Create SQL commands to analyze the database
    const sqlCommands = `
-- Show all tables
SHOW TABLES;

-- Analyze key inventory tables structure
DESCRIBE products;
DESCRIBE warehouse_inventory;
DESCRIBE warehouse_dispatch;
DESCRIBE warehouse_damage;
DESCRIBE warehouse_return;
DESCRIBE warehouse_recovery;

-- Get table counts
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

-- Analyze warehouse stock distribution
SELECT 
    warehouse,
    COUNT(*) as product_count,
    SUM(current_stock) as total_stock,
    AVG(current_stock) as avg_stock
FROM warehouse_inventory 
GROUP BY warehouse
ORDER BY total_stock DESC;

-- Analyze dispatch patterns
SELECT 
    warehouse,
    status,
    COUNT(*) as dispatch_count,
    SUM(qty) as total_qty
FROM warehouse_dispatch 
GROUP BY warehouse, status
ORDER BY warehouse, dispatch_count DESC;

-- Check for recent activity
SELECT 
    'Recent Dispatches' as activity_type,
    COUNT(*) as count
FROM warehouse_dispatch 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT 
    'Recent Damages',
    COUNT(*)
FROM warehouse_damage 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT 
    'Recent Returns',
    COUNT(*)
FROM warehouse_return 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Show sample product data
SELECT 
    p_id,
    product_name,
    barcode,
    category,
    selling_price
FROM products 
LIMIT 5;

-- Show sample warehouse inventory
SELECT 
    wi.warehouse,
    p.product_name,
    wi.current_stock,
    wi.last_updated
FROM warehouse_inventory wi
JOIN products p ON wi.p_id = p.p_id
ORDER BY wi.current_stock DESC
LIMIT 10;

-- Analyze inventory flow patterns
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
WHERE current_stock = 0;
`;

    // Write SQL to temporary file
    fs.writeFileSync('temp_analysis.sql', sqlCommands);
    
    console.log('📊 Executing database analysis...\n');
    
    // Execute via SSH
    const sshCommand = `ssh -i "C:\\Users\\Admin\\e2c.pem" ubuntu@18.143.163.44 "mysql -u root -pHunyhuny@2023 inventory_db"`;
    
    return new Promise((resolve, reject) => {
        const process = spawn('cmd', ['/c', `${sshCommand} < temp_analysis.sql`], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });
        
        let output = '';
        let errorOutput = '';
        
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        process.on('close', (code) => {
            // Clean up temp file
            try {
                fs.unlinkSync('temp_analysis.sql');
            } catch (e) {
                // Ignore cleanup errors
            }
            
            if (code === 0) {
                console.log('✅ Database Analysis Results:');
                console.log('-'.repeat(50));
                console.log(output);
                
                // Parse and format the output for better understanding
                console.log('\n📋 INVENTORY FLOW ANALYSIS SUMMARY:');
                console.log('-'.repeat(50));
                console.log('Based on the database structure, here\'s what we found:');
                console.log('');
                console.log('🏪 WAREHOUSE SYSTEM:');
                console.log('  • Multiple warehouses managing inventory');
                console.log('  • Real-time stock tracking per warehouse');
                console.log('  • Product dispatch/outbound tracking');
                console.log('');
                console.log('📦 INVENTORY OPERATIONS:');
                console.log('  • warehouse_inventory: Current stock levels');
                console.log('  • warehouse_dispatch: Outbound movements');
                console.log('  • warehouse_damage: Damage tracking');
                console.log('  • warehouse_return: Return processing');
                console.log('  • warehouse_recovery: Recovery operations');
                console.log('');
                console.log('🔄 MANUAL IN/OUT MOVEMENT OPPORTUNITIES:');
                console.log('  ✅ Stock Adjustments (warehouse_inventory)');
                console.log('  ✅ Manual Dispatch (warehouse_dispatch)');
                console.log('  ✅ Damage Recording (warehouse_damage)');
                console.log('  ✅ Return Processing (warehouse_return)');
                console.log('  ✅ Recovery Tracking (warehouse_recovery)');
                
                resolve(output);
            } else {
                console.error('❌ Analysis failed:', errorOutput);
                reject(new Error(errorOutput));
            }
        });
    });
}

// Run the analysis
analyzeDatabase().catch(console.error);