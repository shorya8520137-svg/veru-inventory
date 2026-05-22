const db = require('./db/connection');

console.log('🔍 Checking warehouse data in database...\n');

// Check warehouses table
console.log('1️⃣ Checking warehouses table:');
db.query('SELECT * FROM warehouses LIMIT 5', (err, warehouses) => {
    if (err) {
        console.error('❌ Error querying warehouses table:', err.message);
    } else {
        console.log(`✅ Found ${warehouses.length} rows in warehouses table`);
        if (warehouses.length > 0) {
            console.log('Sample data:', JSON.stringify(warehouses[0], null, 2));
        }
    }
    
    // Check stores table
    console.log('\n2️⃣ Checking stores table:');
    db.query('SELECT * FROM stores LIMIT 5', (err2, stores) => {
        if (err2) {
            console.error('❌ Error querying stores table:', err2.message);
        } else {
            console.log(`✅ Found ${stores.length} rows in stores table`);
            if (stores.length > 0) {
                console.log('Sample data:', JSON.stringify(stores[0], null, 2));
            }
        }
        
        // Check inventory table for unique warehouses
        console.log('\n3️⃣ Checking unique warehouses in inventory table:');
        db.query('SELECT DISTINCT warehouse, warehouse_code FROM inventory WHERE warehouse_code IS NOT NULL AND warehouse_code != "" LIMIT 10', (err3, invWarehouses) => {
            if (err3) {
                console.error('❌ Error querying inventory:', err3.message);
            } else {
                console.log(`✅ Found ${invWarehouses.length} unique warehouses in inventory`);
                invWarehouses.forEach((w, i) => {
                    console.log(`   ${i+1}. ${w.warehouse} (${w.warehouse_code})`);
                });
            }
            
            db.end();
        });
    });
});
