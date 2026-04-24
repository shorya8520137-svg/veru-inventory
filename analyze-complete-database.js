/**
 * COMPLETE DATABASE ANALYSIS SCRIPT
 * Downloads and analyzes all inventory-related data
 * Identifies stock reduction logic and data flow issues
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: '13.212.82.15',
    user: 'root',
    password: 'Huny@2024',
    database: 'inventory_db',
    port: 3306
};

async function analyzeCompleteDatabase() {
    let connection;
    
    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database');

        // 1. ANALYZE INVENTORY TABLES STRUCTURE
        console.log('\n📊 ANALYZING TABLE STRUCTURES...');
        
        const inventoryTables = [
            'inventory',
            'stock_batches', 
            'inventory_ledger_base',
            'self_transfer',
            'self_transfer_items',
            'store_inventory',
            'warehouse_dispatch',
            'dispatch_product'
        ];

        for (const table of inventoryTables) {
            try {
                const [structure] = await connection.execute(`DESCRIBE ${table}`);
                console.log(`\n📋 ${table.toUpperCase()} TABLE STRUCTURE:`);
                structure.forEach(col => {
                    console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
                });
                
                const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`  📊 Total Records: ${count[0].count}`);
            } catch (err) {
                console.log(`❌ Table ${table} not found or error: ${err.message}`);
            }
        }

        // 2. ANALYZE INVENTORY LEDGER DATA
        console.log('\n\n🔍 ANALYZING INVENTORY LEDGER DATA...');
        
        const [ledgerData] = await connection.execute(`
            SELECT 
                movement_type,
                direction,
                COUNT(*) as count,
                SUM(qty) as total_qty,
                MIN(event_time) as first_event,
                MAX(event_time) as last_event
            FROM inventory_ledger_base 
            GROUP BY movement_type, direction
            ORDER BY count DESC
        `);
        
        console.log('📈 LEDGER MOVEMENT SUMMARY:');
        ledgerData.forEach(row => {
            console.log(`  ${row.movement_type} (${row.direction}): ${row.count} entries, ${row.total_qty} qty`);
        });

        // 3. ANALYZE SELF TRANSFER DATA
        console.log('\n\n🔄 ANALYZING SELF TRANSFER DATA...');
        
        const [selfTransfers] = await connection.execute(`
            SELECT 
                st.id,
                st.transfer_reference,
                st.transfer_type,
                st.source_location,
                st.destination_location,
                st.status,
                st.created_at,
                COUNT(sti.id) as item_count
            FROM self_transfer st
            LEFT JOIN self_transfer_items sti ON st.id = sti.transfer_id
            GROUP BY st.id
            ORDER BY st.created_at DESC
            LIMIT 10
        `);
        
        console.log('🔄 RECENT SELF TRANSFERS:');
        selfTransfers.forEach(transfer => {
            console.log(`  ${transfer.transfer_reference}: ${transfer.transfer_type} | ${transfer.source_location} → ${transfer.destination_location} | ${transfer.item_count} items | ${transfer.status}`);
        });

        // 4. ANALYZE STOCK DISCREPANCIES
        console.log('\n\n⚠️  ANALYZING STOCK DISCREPANCIES...');
        
        const [stockComparison] = await connection.execute(`
            SELECT 
                i.code as barcode,
                i.warehouse,
                i.stock as inventory_stock,
                COALESCE(SUM(sb.qty_available), 0) as batch_stock,
                (i.stock - COALESCE(SUM(sb.qty_available), 0)) as difference
            FROM inventory i
            LEFT JOIN stock_batches sb ON i.code = sb.barcode AND i.warehouse = sb.warehouse AND sb.status = 'active'
            GROUP BY i.code, i.warehouse, i.stock
            HAVING difference != 0
            ORDER BY ABS(difference) DESC
            LIMIT 20
        `);
        
        console.log('📊 STOCK DISCREPANCIES (inventory vs stock_batches):');
        stockComparison.forEach(row => {
            console.log(`  ${row.barcode} (${row.warehouse}): inventory=${row.inventory_stock}, batches=${row.batch_stock}, diff=${row.difference}`);
        });

        // 5. ANALYZE PRODUCT NAMES IN LEDGER
        console.log('\n\n📝 ANALYZING PRODUCT NAMES IN LEDGER...');
        
        const [productNames] = await connection.execute(`
            SELECT 
                barcode,
                product_name,
                COUNT(*) as entries,
                GROUP_CONCAT(DISTINCT movement_type) as movement_types
            FROM inventory_ledger_base 
            WHERE barcode IN (
                SELECT DISTINCT barcode FROM inventory_ledger_base 
                WHERE movement_type = 'SELF_TRANSFER' 
                LIMIT 10
            )
            GROUP BY barcode, product_name
            ORDER BY entries DESC
        `);
        
        console.log('📝 PRODUCT NAMES IN LEDGER:');
        productNames.forEach(row => {
            console.log(`  ${row.barcode}: "${row.product_name}" | ${row.entries} entries | Types: ${row.movement_types}`);
        });

        // 6. ANALYZE STORE INVENTORY
        console.log('\n\n🏪 ANALYZING STORE INVENTORY...');
        
        const [storeInventory] = await connection.execute(`
            SELECT 
                product_name,
                barcode,
                category,
                stock,
                price,
                created_at
            FROM store_inventory 
            ORDER BY created_at DESC
            LIMIT 20
        `);
        
        console.log('🏪 RECENT STORE INVENTORY:');
        storeInventory.forEach(row => {
            console.log(`  ${row.barcode}: "${row.product_name}" | Category: "${row.category}" | Stock: ${row.stock}`);
        });

        // 7. FIND SPECIFIC PRODUCT DATA (2005-999)
        console.log('\n\n🔍 ANALYZING SPECIFIC PRODUCT (2005-999)...');
        
        const [productData] = await connection.execute(`
            SELECT 'inventory' as source, code as barcode, warehouse, stock, opening, return_qty
            FROM inventory WHERE code = '2005-999'
            UNION ALL
            SELECT 'stock_batches' as source, barcode, warehouse, qty_available as stock, qty_initial as opening, 0 as return_qty
            FROM stock_batches WHERE barcode = '2005-999' AND status = 'active'
            UNION ALL
            SELECT 'store_inventory' as source, barcode, 'STORE' as warehouse, stock, 0 as opening, 0 as return_qty
            FROM store_inventory WHERE barcode = '2005-999'
        `);
        
        console.log('🔍 PRODUCT 2005-999 DATA:');
        productData.forEach(row => {
            console.log(`  ${row.source}: ${row.warehouse} | Stock: ${row.stock} | Opening: ${row.opening}`);
        });

        // 8. ANALYZE LEDGER FOR SPECIFIC PRODUCT
        const [productLedger] = await connection.execute(`
            SELECT 
                event_time,
                movement_type,
                direction,
                qty,
                location_code,
                reference,
                product_name
            FROM inventory_ledger_base 
            WHERE barcode = '2005-999'
            ORDER BY event_time DESC
            LIMIT 20
        `);
        
        console.log('📊 PRODUCT 2005-999 LEDGER HISTORY:');
        productLedger.forEach(row => {
            console.log(`  ${row.event_time} | ${row.movement_type} (${row.direction}) | ${row.qty} | ${row.location_code} | "${row.product_name}"`);
        });

        // 9. GENERATE SUMMARY REPORT
        console.log('\n\n📋 SUMMARY REPORT:');
        console.log('=====================================');
        
        const [totalInventory] = await connection.execute(`SELECT COUNT(*) as count FROM inventory`);
        const [totalBatches] = await connection.execute(`SELECT COUNT(*) as count FROM stock_batches WHERE status = 'active'`);
        const [totalLedger] = await connection.execute(`SELECT COUNT(*) as count FROM inventory_ledger_base`);
        const [totalTransfers] = await connection.execute(`SELECT COUNT(*) as count FROM self_transfer`);
        const [totalStoreItems] = await connection.execute(`SELECT COUNT(*) as count FROM store_inventory`);
        
        console.log(`📊 Total Inventory Records: ${totalInventory[0].count}`);
        console.log(`📦 Total Active Batches: ${totalBatches[0].count}`);
        console.log(`📝 Total Ledger Entries: ${totalLedger[0].count}`);
        console.log(`🔄 Total Self Transfers: ${totalTransfers[0].count}`);
        console.log(`🏪 Total Store Items: ${totalStoreItems[0].count}`);
        
        console.log('\n✅ Database analysis complete!');
        
    } catch (error) {
        console.error('❌ Database analysis failed:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the analysis
analyzeCompleteDatabase().catch(console.error);