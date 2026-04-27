const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function findStoreInventory() {
    console.log('🔍 Finding stores with inventory...\n');
    
    // Check store_timeline table for products
    const sshCommand = `ssh -i "C:\\Users\\singh\\.ssh\\pem.pem" ubuntu@52.77.209.49 "mysql -u inventory_user -p'StrongPass@123' inventory_db -e 'SELECT store_code, barcode, product_name, SUM(CASE WHEN direction = \\\"IN\\\" THEN quantity ELSE -quantity END) as current_stock FROM store_timeline GROUP BY store_code, barcode, product_name HAVING current_stock > 5 ORDER BY current_stock DESC LIMIT 10;'"`;
    
    try {
        const { stdout, stderr } = await execPromise(sshCommand);
        
        if (stderr && !stderr.includes('Warning')) {
            console.error('❌ Error:', stderr);
            return;
        }
        
        console.log('✅ Stores with inventory:\n');
        console.log(stdout);
        
    } catch (error) {
        console.error('❌ SSH Error:', error.message);
    }
}

findStoreInventory();
