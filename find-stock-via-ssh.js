const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function findProductsWithStock() {
    console.log('🔍 Finding products with stock via SSH...\n');
    
    const sshCommand = `ssh -i "C:\\Users\\singh\\.ssh\\pem.pem" ubuntu@52.77.209.49 "mysql -u inventory_user -p'StrongPass@123' inventory_db -e 'SELECT barcode, product_name, warehouse, SUM(qty_available) as total_stock FROM stock_batches WHERE status = \\\"active\\\" AND qty_available > 0 GROUP BY barcode, product_name, warehouse HAVING total_stock > 5 ORDER BY total_stock DESC LIMIT 10;'"`;
    
    try {
        const { stdout, stderr } = await execPromise(sshCommand);
        
        if (stderr && !stderr.includes('Warning')) {
            console.error('❌ Error:', stderr);
            return;
        }
        
        console.log('✅ Products with stock:\n');
        console.log(stdout);
        
    } catch (error) {
        console.error('❌ SSH Error:', error.message);
    }
}

findProductsWithStock();
