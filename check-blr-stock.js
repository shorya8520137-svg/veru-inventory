/**
 * Check current stock for product in BLR warehouse
 */

const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '52.77.209.49',
    user: 'inventory_user',
    password: 'StrongPass@123',
    database: 'inventory_db'
});

const barcode = '972946773347';
const warehouse = 'BLR_WH';

console.log('🔍 Checking stock for:');
console.log('   Product: Lounge / Resort Casual Product 11');
console.log('   Barcode:', barcode);
console.log('   Warehouse:', warehouse);
console.log('');

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err);
        process.exit(1);
    }

    console.log('✅ Connected to database\n');

    // Query 1: Check stock_batches
    const stockQuery = `
        SELECT 
            id,
            product_name,
            barcode,
            warehouse,
            qty_initial,
            qty_available,
            status,
            source_type,
            created_at
        FROM stock_batches 
        WHERE barcode = ? AND warehouse = ?
        ORDER BY created_at DESC
    `;

    connection.query(stockQuery, [barcode, warehouse], (err, batches) => {
        if (err) {
            console.error('❌ Query failed:', err);
            connection.end();
            process.exit(1);
        }

        console.log('📦 STOCK BATCHES:');
        console.log('═══════════════════════════════════════════════\n');

        if (batches.length === 0) {
            console.log('⚠️  No stock batches found\n');
        } else {
            let totalAvailable = 0;
            batches.forEach((batch, index) => {
                console.log(`Batch #${index + 1}:`);
                console.log(`   ID: ${batch.id}`);
                console.log(`   Product: ${batch.product_name}`);
                console.log(`   Initial Qty: ${batch.qty_initial}`);
                console.log(`   Available Qty: ${batch.qty_available}`);
                console.log(`   Status: ${batch.status}`);
                console.log(`   Source: ${batch.source_type}`);
                console.log(`   Created: ${batch.created_at}`);
                console.log('');
                
                if (batch.status === 'active') {
                    totalAvailable += parseFloat(batch.qty_available);
                }
            });

            console.log('═══════════════════════════════════════════════');
            console.log(`📊 TOTAL AVAILABLE STOCK: ${totalAvailable} units`);
            console.log('═══════════════════════════════════════════════\n');
        }

        // Query 2: Check recent timeline entries
        const timelineQuery = `
            SELECT 
                event_time,
                movement_type,
                qty,
                direction,
                reference
            FROM inventory_ledger_base
            WHERE barcode = ? AND location_code = ?
            ORDER BY event_time DESC
            LIMIT 10
        `;

        connection.query(timelineQuery, [barcode, warehouse], (err, timeline) => {
            if (err) {
                console.error('❌ Timeline query failed:', err);
                connection.end();
                process.exit(1);
            }

            console.log('📜 RECENT TIMELINE (Last 10 entries):');
            console.log('═══════════════════════════════════════════════\n');

            if (timeline.length === 0) {
                console.log('⚠️  No timeline entries found\n');
            } else {
                timeline.forEach((entry, index) => {
                    const direction = entry.direction === 'IN' ? '📥' : '📤';
                    const qty = entry.direction === 'IN' ? `+${entry.qty}` : `-${entry.qty}`;
                    console.log(`${index + 1}. ${direction} ${entry.movement_type} | ${qty} units | ${entry.event_time}`);
                    console.log(`   Reference: ${entry.reference || 'N/A'}`);
                    console.log('');
                });
            }

            connection.end();
            console.log('✅ Done\n');
        });
    });
});
