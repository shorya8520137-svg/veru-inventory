const db = require('./db/connection');

console.log('🔧 Fixing api_key column size...\n');

// First check current column size
db.query('DESCRIBE api_keys', (err, results) => {
    if (err) {
        console.error('❌ Error checking table:', err);
        process.exit(1);
    }
    
    console.log('Current api_keys table structure:');
    results.forEach(col => {
        if (col.Field === 'api_key') {
            console.log(`  api_key: ${col.Type}`);
        }
    });
    
    console.log('\n🔄 Updating api_key column to VARCHAR(1000)...\n');
    
    // Alter the column
    db.query('ALTER TABLE api_keys MODIFY COLUMN api_key VARCHAR(1000) NOT NULL', (err, result) => {
        if (err) {
            console.error('❌ Error altering column:', err);
            process.exit(1);
        }
        
        console.log('✅ Column altered successfully!\n');
        
        // Verify the change
        db.query('DESCRIBE api_keys', (err, results) => {
            if (err) {
                console.error('❌ Error verifying:', err);
                process.exit(1);
            }
            
            console.log('Updated api_keys table structure:');
            results.forEach(col => {
                if (col.Field === 'api_key') {
                    console.log(`  api_key: ${col.Type}`);
                }
            });
            
            console.log('\n✅ Done! JWT tokens can now be stored.\n');
            process.exit(0);
        });
    });
});
