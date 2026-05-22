const db = require('./db/connection');

console.log('🔍 Checking warehouses table structure and data...\n');

// Check table structure
db.query('DESCRIBE warehouses', (err, structure) => {
    if (err) {
        console.error('❌ Error describing warehouses table:', err.message);
        console.log('\n📋 Checking if table exists...');
        
        db.query('SHOW TABLES LIKE "warehouses"', (err2, tables) => {
            if (err2) {
                console.error('❌ Error checking tables:', err2.message);
            } else if (tables.length === 0) {
                console.log('❌ warehouses table does NOT exist');
            } else {
                console.log('✅ warehouses table exists');
            }
            db.end();
        });
        return;
    }
    
    console.log('✅ Warehouses table structure:');
    console.table(structure);
    
    // Get all warehouses
    db.query('SELECT * FROM warehouses LIMIT 20', (err, warehouses) => {
        if (err) {
            console.error('❌ Error fetching warehouses:', err.message);
            db.end();
            return;
        }
        
        console.log(`\n📦 Found ${warehouses.length} warehouses:\n`);
        
        if (warehouses.length > 0) {
            warehouses.forEach((wh, index) => {
                console.log(`${index + 1}. ${wh.name || wh.warehouse_name} (${wh.code || wh.warehouse_code})`);
                console.log(`   Location: ${wh.city}, ${wh.state}`);
                console.log(`   Manager: ${wh.manager_name || 'N/A'}`);
                console.log(`   Phone: ${wh.phone || 'N/A'}`);
                console.log('');
            });
            
            console.log('\n📋 Full data sample:');
            console.log(JSON.stringify(warehouses[0], null, 2));
        } else {
            console.log('⚠️ No warehouses found in table');
        }
        
        db.end();
    });
});
