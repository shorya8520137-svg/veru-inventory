#!/usr/bin/env node

// Script to analyze the complete inventory database structure
// This will help understand the flow for manual in/out product movements

const mysql = require('mysql2/promise');

async function analyzeInventoryDatabase() {
    let connection;
    
    try {
        // Connect to the production database
        connection = await mysql.createConnection({
            host: '18.143.163.44',
            user: 'root',
            password: 'Hunyhuny@2023',
            database: 'inventory_db',
            port: 3306
        });

        console.log('✅ Connected to inventory_db successfully!');
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPLETE INVENTORY DATABASE ANALYSIS');
        console.log('='.repeat(80));

        // 1. Get all tables in the database
        console.log('\n🗂️  DATABASE TABLES:');
        console.log('-'.repeat(50));
        const [tables] = await connection.execute('SHOW TABLES');
        
        const tableNames = tables.map(row => Object.values(row)[0]);
        tableNames.forEach((table, index) => {
            console.log(`${index + 1}. ${table}`);
        });

        // 2. Analyze key inventory-related tables
        const inventoryTables = [
            'products',
            'inventory',
            'warehouse_inventory', 
            'warehouse_dispatch',
            'warehouse_damage',
            'warehouse_return',
            'warehouse_recovery',
            'warehouse_order_activity',
            'inventory_movements',
            'stock_movements'
        ];

        for (const tableName of inventoryTables) {
            if (tableNames.includes(tableName)) {
                console.log(`\n📋 TABLE: ${tableName.toUpperCase()}`);
                console.log('-'.repeat(50));
                
                // Get table structure
                const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
                console.log('COLUMNS:');
                columns.forEach(col => {
                    console.log(`  • ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
                });

                // Get sample data count
                const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                console.log(`RECORDS: ${countResult[0].count}`);

                // Show sample records (first 3)
                if (countResult[0].count > 0) {
                    const [sampleData] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
                    console.log('SAMPLE DATA:');
                    sampleData.forEach((row, index) => {
                        console.log(`  Record ${index + 1}:`, JSON.stringify(row, null, 2));
                    });
                }
            }
        }

        // 3. Analyze relationships and foreign keys
        console.log('\n🔗 FOREIGN KEY RELATIONSHIPS:');
        console.log('-'.repeat(50));
        const [fkQuery] = await connection.execute(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE REFERENCED_TABLE_SCHEMA = 'inventory_db'
            ORDER BY TABLE_NAME, COLUMN_NAME
        `);
        
        fkQuery.forEach(fk => {
            console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });

        // 4. Analyze inventory flow patterns
        console.log('\n📈 INVENTORY FLOW ANALYSIS:');
        console.log('-'.repeat(50));

        // Check if there are stock movement tracking tables
        if (tableNames.includes('warehouse_inventory')) {
            const [warehouseStock] = await connection.execute(`
                SELECT 
                    warehouse,
                    COUNT(*) as product_count,
                    SUM(current_stock) as total_stock
                FROM warehouse_inventory 
                GROUP BY warehouse
                ORDER BY total_stock DESC
            `);
            
            console.log('WAREHOUSE STOCK SUMMARY:');
            warehouseStock.forEach(ws => {
                console.log(`  ${ws.warehouse}: ${ws.product_count} products, ${ws.total_stock} total stock`);
            });
        }

        // Check dispatch patterns
        if (tableNames.includes('warehouse_dispatch')) {
            const [dispatchStats] = await connection.execute(`
                SELECT 
                    warehouse,
                    status,
                    COUNT(*) as dispatch_count,
                    SUM(qty) as total_qty
                FROM warehouse_dispatch 
                GROUP BY warehouse, status
                ORDER BY warehouse, dispatch_count DESC
            `);
            
            console.log('\nDISPATCH PATTERNS:');
            dispatchStats.forEach(ds => {
                console.log(`  ${ds.warehouse} - ${ds.status}: ${ds.dispatch_count} dispatches, ${ds.total_qty} qty`);
            });
        }

        // 5. Identify manual movement opportunities
        console.log('\n🔄 MANUAL MOVEMENT OPPORTUNITIES:');
        console.log('-'.repeat(50));
        
        console.log('Based on the database structure, manual in/out movements can be implemented through:');
        
        if (tableNames.includes('warehouse_inventory')) {
            console.log('✅ warehouse_inventory table - for stock adjustments');
        }
        
        if (tableNames.includes('warehouse_dispatch')) {
            console.log('✅ warehouse_dispatch table - for outbound movements');
        }
        
        if (tableNames.includes('warehouse_damage')) {
            console.log('✅ warehouse_damage table - for damage tracking');
        }
        
        if (tableNames.includes('warehouse_return')) {
            console.log('✅ warehouse_return table - for return processing');
        }

        // Check for audit/logging tables
        const auditTables = tableNames.filter(t => 
            t.includes('audit') || 
            t.includes('log') || 
            t.includes('activity') ||
            t.includes('movement')
        );
        
        if (auditTables.length > 0) {
            console.log('\n📝 AUDIT/LOGGING TABLES:');
            auditTables.forEach(table => {
                console.log(`  • ${table}`);
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ DATABASE ANALYSIS COMPLETE');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Database analysis failed:', error.message);
        console.error('Full error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the analysis
analyzeInventoryDatabase();