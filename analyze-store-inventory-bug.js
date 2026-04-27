/**
 * ANALYZE STORE INVENTORY BUG
 * 
 * This script analyzes the database to find the store inventory bug
 * by checking if products are being updated in the correct stores
 */

const mysql = require('mysql2/promise');

// Database configuration from .env.production
const dbConfig = {
    host: '13.212.82.15',
    user: 'inventory_user',
    password: 'StrongPass@123',
    database: 'inventory_db',
    port: 3306
};

async function analyzeStoreInventoryBug() {
    let connection;
    
    try {
        console.log('🔌 Connecting to production database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');
        
        // 1. Check store_inventory table structure
        console.log('📋 === CHECKING STORE_INVENTORY TABLE STRUCTURE ===');
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM store_inventory
        `);
        console.log('Columns:', columns.map(c => `${c.Field} (${c.Type})`).join(', '));
        console.log('');
        
        // 2. Check current store inventory
        console.log('📦 === CURRENT STORE INVENTORY ===');
        const [inventory] = await connection.query(`
            SELECT 
                id,
                store_code,
                barcode,
                product_name,
                stock,
                last_updated
            FROM store_inventory
            ORDER BY last_updated DESC
            LIMIT 20
        `);
        
        console.log(`Found ${inventory.length} products in store_inventory`);
        console.log('');
        
        // Group by store_code
        const byStore = {};
        inventory.forEach(item => {
            const store = item.store_code || 'NULL';
            if (!byStore[store]) byStore[store] = [];
            byStore[store].push(item);
        });
        
        console.log('Products per store:');
        Object.keys(byStore).forEach(store => {
            console.log(`  ${store}: ${byStore[store].length} products`);
            byStore[store].forEach(p => {
                console.log(`    - ${p.barcode} (${p.product_name}): ${p.stock} units`);
            });
        });
        console.log('');
        
        // 3. Check store_timeline entries
        console.log('📊 === STORE TIMELINE ENTRIES ===');
        const [timeline] = await connection.query(`
            SELECT 
                id,
                store_code,
                product_barcode,
                product_name,
                movement_type,
                direction,
                quantity,
                balance_after,
                reference,
                created_at
            FROM store_timeline
            ORDER BY created_at DESC
            LIMIT 20
        `);
        
        console.log(`Found ${timeline.length} timeline entries`);
        console.log('');
        
        // Group timeline by store_code
        const timelineByStore = {};
        timeline.forEach(entry => {
            const store = entry.store_code || 'NULL';
            if (!timelineByStore[store]) timelineByStore[store] = [];
            timelineByStore[store].push(entry);
        });
        
        console.log('Timeline entries per store:');
        Object.keys(timelineByStore).forEach(store => {
            console.log(`  ${store}: ${timelineByStore[store].length} entries`);
            timelineByStore[store].forEach(e => {
                console.log(`    - ${e.movement_type} ${e.direction} ${e.quantity} units of ${e.product_barcode} (balance: ${e.balance_after}) - ${e.reference}`);
            });
        });
        console.log('');
        
        // 4. Check for mismatches
        console.log('🔍 === CHECKING FOR MISMATCHES ===');
        const [mismatches] = await connection.query(`
            SELECT 
                si.barcode,
                si.store_code as inventory_store,
                st.store_code as timeline_store,
                si.stock as inventory_stock,
                st.balance_after as timeline_balance,
                st.reference,
                st.created_at
            FROM store_inventory si
            LEFT JOIN store_timeline st ON si.barcode = st.product_barcode
            WHERE si.store_code != st.store_code
            ORDER BY st.created_at DESC
            LIMIT 10
        `);
        
        if (mismatches.length > 0) {
            console.log(`❌ Found ${mismatches.length} mismatches between inventory and timeline:`);
            mismatches.forEach(m => {
                console.log(`  Barcode: ${m.barcode}`);
                console.log(`    Inventory store: ${m.inventory_store} (stock: ${m.inventory_stock})`);
                console.log(`    Timeline store: ${m.timeline_store} (balance: ${m.timeline_balance})`);
                console.log(`    Reference: ${m.reference}`);
                console.log(`    Created: ${m.created_at}`);
                console.log('');
            });
        } else {
            console.log('✅ No mismatches found between inventory and timeline');
        }
        console.log('');
        
        // 5. Check recent transfers
        console.log('📋 === RECENT TRANSFERS ===');
        const [transfers] = await connection.query(`
            SELECT 
                transfer_reference,
                transfer_type,
                source_location,
                destination_location,
                status,
                created_at
            FROM self_transfer
            ORDER BY created_at DESC
            LIMIT 10
        `);
        
        console.log(`Found ${transfers.length} recent transfers:`);
        transfers.forEach(t => {
            console.log(`  ${t.transfer_reference}: ${t.transfer_type} from ${t.source_location} to ${t.destination_location} (${t.status})`);
        });
        console.log('');
        
        // 6. Check if store_code is being used correctly in queries
        console.log('🔧 === TESTING STORE_CODE FILTERING ===');
        const testStores = ['GGM_MGF_MALL', 'DEL_MOTI_NAGAR', 'HYD_KONDAPUR'];
        
        for (const store of testStores) {
            const [storeProducts] = await connection.query(`
                SELECT COUNT(*) as count
                FROM store_inventory
                WHERE store_code = ?
            `, [store]);
            
            console.log(`  ${store}: ${storeProducts[0].count} products`);
        }
        console.log('');
        
        // 7. Summary
        console.log('📊 === SUMMARY ===');
        console.log(`Total products in store_inventory: ${inventory.length}`);
        console.log(`Total timeline entries: ${timeline.length}`);
        console.log(`Stores with products: ${Object.keys(byStore).length}`);
        console.log(`Stores with timeline: ${Object.keys(timelineByStore).length}`);
        console.log(`Mismatches found: ${mismatches.length}`);
        console.log('');
        
        if (mismatches.length > 0) {
            console.log('❌ BUG CONFIRMED: Products are being updated in wrong stores');
            console.log('   The fix in selfTransferRoutes.js should resolve this issue');
        } else {
            console.log('✅ No bugs found - store_code is being used correctly');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the analysis
analyzeStoreInventoryBug();
