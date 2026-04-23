const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'inventory_user',
    password: 'StrongPass@123',
    database: 'inventory_db'
});

async function testInventoryTransfer() {
    console.log('=== INVENTORY TRANSFER TEST ===\n');
    
    try {
        // 1. Check warehouse inventory
        console.log('1. Checking warehouse inventory...');
        const warehouseData = await new Promise((resolve, reject) => {
            db.query('SELECT product, code, stock, warehouse FROM inventory WHERE stock > 0 LIMIT 5', (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        console.log('Warehouse inventory:');
        warehouseData.forEach(item => {
            console.log(`  - ${item.product} | ${item.code} | Stock: ${item.stock} | Warehouse: ${item.warehouse}`);
        });
        
        // 2. Check store inventory
        console.log('\n2. Checking store inventory...');
        const storeData = await new Promise((resolve, reject) => {
            db.query('SELECT product_name, barcode, stock FROM store_inventory LIMIT 5', (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        console.log('Store inventory:');
        storeData.forEach(item => {
            console.log(`  - ${item.product_name} | ${item.barcode} | Stock: ${item.stock}`);
        });
        
        // 3. Find matching products
        console.log('\n3. Finding matching products...');
        const testBarcode = '2460-3499';
        
        const warehouseItem = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM inventory WHERE code = ?', [testBarcode], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
        
        const storeItem = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM store_inventory WHERE barcode = ?', [testBarcode], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
        
        console.log(`Warehouse item (${testBarcode}):`, warehouseItem || 'NOT FOUND');
        console.log(`Store item (${testBarcode}):`, storeItem || 'NOT FOUND');
        
        // 4. Test transfer simulation
        if (warehouseItem && storeItem) {
            console.log('\n4. Simulating transfer...');
            const transferQty = 2;
            
            console.log(`Before transfer:`);
            console.log(`  Warehouse stock: ${warehouseItem.stock}`);
            console.log(`  Store stock: ${storeItem.stock}`);
            
            // Simulate warehouse to store transfer
            const newWarehouseStock = Math.max(0, warehouseItem.stock - transferQty);
            const newStoreStock = storeItem.stock + transferQty;
            
            console.log(`After transfer (${transferQty} units):`);
            console.log(`  Warehouse stock: ${newWarehouseStock}`);
            console.log(`  Store stock: ${newStoreStock}`);
            
            console.log('\n✅ Transfer simulation successful!');
        } else {
            console.log('\n❌ Cannot simulate transfer - product not found in both systems');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        db.end();
    }
}

testInventoryTransfer();