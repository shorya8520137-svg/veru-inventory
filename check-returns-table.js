const mysql = require('mysql2/promise');

async function checkReturnsTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'inventory_user',
        password: 'StrongPass@123',
        database: 'inventory_db'
    });

    try {
        console.log('🔍 Checking returns_main table...\n');

        // Get total count
        const [countResult] = await connection.query('SELECT COUNT(*) as total FROM returns_main');
        console.log(`📊 Total returns in database: ${countResult[0].total}\n`);

        if (countResult[0].total > 0) {
            // Get all returns with details
            const [returns] = await connection.query(`
                SELECT 
                    id,
                    return_type,
                    source_location,
                    destination_location,
                    product_type,
                    barcode,
                    quantity,
                    \`condition\`,
                    status,
                    processed_by,
                    processed_at,
                    submitted_at,
                    warehouse,
                    awb,
                    order_ref,
                    return_reason,
                    notes
                FROM returns_main 
                ORDER BY id DESC
            `);

            console.log('📋 Returns Records:\n');
            returns.forEach((ret, index) => {
                console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.log(`Return #${index + 1} (ID: ${ret.id})`);
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.log(`Type:              ${ret.return_type || 'N/A'}`);
                console.log(`Source Location:   ${ret.source_location || 'N/A'}`);
                console.log(`Destination:       ${ret.destination_location || 'N/A'}`);
                console.log(`Warehouse:         ${ret.warehouse || 'N/A'}`);
                console.log(`Product:           ${ret.product_type}`);
                console.log(`Barcode:           ${ret.barcode}`);
                console.log(`Quantity:          ${ret.quantity}`);
                console.log(`Condition:         ${ret.condition || 'N/A'}`);
                console.log(`Status:            ${ret.status || 'N/A'}`);
                console.log(`AWB:               ${ret.awb || 'N/A'}`);
                console.log(`Order Ref:         ${ret.order_ref || 'N/A'}`);
                console.log(`Return Reason:     ${ret.return_reason || 'N/A'}`);
                console.log(`Notes:             ${ret.notes || 'N/A'}`);
                console.log(`Processed By:      ${ret.processed_by || 'N/A'}`);
                console.log(`Processed At:      ${ret.processed_at || 'N/A'}`);
                console.log(`Submitted At:      ${ret.submitted_at}`);
            });

            // Check for timeline entries
            console.log('\n\n🔍 Checking Timeline Entries...\n');
            
            // Check inventory_ledger_base
            const [ledgerEntries] = await connection.query(`
                SELECT 
                    id,
                    event_time,
                    movement_type,
                    barcode,
                    product_name,
                    location_code,
                    qty,
                    direction,
                    reference
                FROM inventory_ledger_base 
                WHERE reference LIKE 'RETURN_%'
                ORDER BY event_time DESC
                LIMIT 20
            `);

            console.log(`📊 Warehouse Timeline Entries (inventory_ledger_base): ${ledgerEntries.length}\n`);
            if (ledgerEntries.length > 0) {
                ledgerEntries.forEach((entry, index) => {
                    console.log(`${index + 1}. [${entry.event_time}] ${entry.movement_type} - ${entry.product_name}`);
                    console.log(`   Location: ${entry.location_code}, Qty: ${entry.qty} ${entry.direction}, Ref: ${entry.reference}`);
                });
            }

            // Check store_timeline
            const [storeEntries] = await connection.query(`
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
                WHERE reference LIKE 'RETURN_%'
                ORDER BY created_at DESC
                LIMIT 20
            `);

            console.log(`\n📊 Store Timeline Entries (store_timeline): ${storeEntries.length}\n`);
            if (storeEntries.length > 0) {
                storeEntries.forEach((entry, index) => {
                    console.log(`${index + 1}. [${entry.created_at}] ${entry.movement_type} - ${entry.product_name}`);
                    console.log(`   Store: ${entry.store_code}, Qty: ${entry.quantity} ${entry.direction}, Balance: ${entry.balance_after}, Ref: ${entry.reference}`);
                });
            }

            // Check stock_batches for returns
            const [stockBatches] = await connection.query(`
                SELECT 
                    id,
                    barcode,
                    product_name,
                    warehouse,
                    qty_initial,
                    qty_available,
                    status,
                    source_type,
                    source_ref_id,
                    created_at
                FROM stock_batches 
                WHERE source_type = 'RETURN'
                ORDER BY created_at DESC
                LIMIT 20
            `);

            console.log(`\n📊 Stock Batches from Returns: ${stockBatches.length}\n`);
            if (stockBatches.length > 0) {
                stockBatches.forEach((batch, index) => {
                    console.log(`${index + 1}. [${batch.created_at}] ${batch.product_name} (${batch.barcode})`);
                    console.log(`   Warehouse: ${batch.warehouse}, Initial: ${batch.qty_initial}, Available: ${batch.qty_available}, Status: ${batch.status}`);
                    console.log(`   Source: ${batch.source_type}, Ref ID: ${batch.source_ref_id}`);
                });
            }

            // Summary
            console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📊 SUMMARY');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Total Returns:              ${countResult[0].total}`);
            console.log(`Warehouse Timeline Entries: ${ledgerEntries.length}`);
            console.log(`Store Timeline Entries:     ${storeEntries.length}`);
            console.log(`Stock Batches from Returns: ${stockBatches.length}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        } else {
            console.log('✅ No returns found in database (table is empty)');
            console.log('This is expected if all return data was cleared during implementation.\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await connection.end();
    }
}

checkReturnsTable();
