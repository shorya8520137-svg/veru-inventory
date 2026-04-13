const db = require('./db/connection');

console.log('🔍 Checking products table schema...');

// Check products table structure
db.query('DESCRIBE products', (err, results) => {
    if (err) {
        console.error('❌ Error checking products schema:', err);
        return;
    }
    
    console.log('📋 Products table schema:');
    console.table(results);
    
    // Look for barcode-related columns
    const barcodeColumns = results.filter(col => 
        col.Field.toLowerCase().includes('barcode') || 
        col.Field.toLowerCase().includes('code') ||
        col.Field.toLowerCase().includes('sku')
    );
    
    console.log('🔍 Potential barcode columns:');
    barcodeColumns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
    });
    
    // Check some sample data
    db.query('SELECT * FROM products LIMIT 3', (err, sampleData) => {
        if (err) {
            console.error('❌ Error getting sample data:', err);
            return;
        }
        
        console.log('📊 Sample products data:');
        console.table(sampleData);
        
        process.exit(0);
    });
});