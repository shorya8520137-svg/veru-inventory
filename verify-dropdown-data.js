const db = require('./db/connection');

console.log('🔍 Verifying Dropdown Data\n');
console.log('='.repeat(60));

// Check warehouses
db.query('SELECT COUNT(*) as count FROM warehouses WHERE is_active = TRUE', (err, results) => {
    if (err) {
        console.log('❌ Error checking warehouses:', err.message);
    } else {
        const count = results[0].count;
        console.log(`\n📦 WAREHOUSES`);
        console.log(`   Active Count: ${count}`);
        
        if (count > 0) {
            db.query('SELECT id, warehouse_code, warehouse_name, city FROM warehouses WHERE is_active = TRUE LIMIT 5', (err, rows) => {
                if (!err) {
                    console.log(`   Sample Data:`);
                    rows.forEach((row, i) => {
                        console.log(`      ${i + 1}. ${row.warehouse_name} (${row.warehouse_code}) - ${row.city} - ID: ${row.id}`);
                    });
                }
                checkStores();
            });
        } else {
            console.log('   ⚠️  No active warehouses found!');
            checkStores();
        }
    }
});

function checkStores() {
    db.query('SELECT COUNT(*) as count FROM stores WHERE is_active = TRUE', (err, results) => {
        if (err) {
            console.log('❌ Error checking stores:', err.message);
        } else {
            const count = results[0].count;
            console.log(`\n🏪 STORES`);
            console.log(`   Active Count: ${count}`);
            
            if (count > 0) {
                db.query('SELECT id, store_code, store_name, store_type, city FROM stores WHERE is_active = TRUE LIMIT 5', (err, rows) => {
                    if (!err) {
                        console.log(`   Sample Data:`);
                        rows.forEach((row, i) => {
                            console.log(`      ${i + 1}. ${row.store_name} (${row.store_code}) - ${row.store_type} - ${row.city} - ID: ${row.id}`);
                        });
                    }
                    finish();
                });
            } else {
                console.log('   ⚠️  No active stores found!');
                finish();
            }
        }
    });
}

function finish() {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Verification complete\n');
    process.exit(0);
}
