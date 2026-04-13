const db = require('./db/connection');

console.log('🔍 Checking inventory_adjustments.adjustment_type column...');

// Check current schema
db.query('DESCRIBE inventory_adjustments', (err, results) => {
    if (err) {
        console.error('❌ Error checking schema:', err);
        return;
    }
    
    console.log('📋 Current inventory_adjustments schema:');
    console.table(results);
    
    // Find the adjustment_type column
    const adjustmentTypeColumn = results.find(col => col.Field === 'adjustment_type');
    if (adjustmentTypeColumn) {
        console.log('🔍 adjustment_type column details:');
        console.log('   Type:', adjustmentTypeColumn.Type);
        console.log('   Null:', adjustmentTypeColumn.Null);
        console.log('   Key:', adjustmentTypeColumn.Key);
        console.log('   Default:', adjustmentTypeColumn.Default);
        
        // Check if it can handle our values
        const testValues = ['in', 'out', 'adjustment', 'damage', 'return', 'transfer'];
        console.log('\n📏 Testing if column can handle our values:');
        
        testValues.forEach(value => {
            const canHandle = adjustmentTypeColumn.Type.includes('varchar(20)') || 
                            adjustmentTypeColumn.Type.includes('varchar(255)') ||
                            adjustmentTypeColumn.Type.includes('text');
            console.log(`   '${value}' (${value.length} chars): ${canHandle ? '✅ OK' : '❌ TOO SMALL'}`);
        });
        
        if (adjustmentTypeColumn.Type.includes('varchar(20)') || 
            adjustmentTypeColumn.Type.includes('varchar(255)') ||
            adjustmentTypeColumn.Type.includes('text')) {
            console.log('\n✅ Column size is sufficient for manual stock updates!');
        } else {
            console.log('\n❌ Column size is TOO SMALL! Run: node fix-adjustment-type-column.js');
        }
    } else {
        console.error('❌ adjustment_type column not found!');
    }
    
    process.exit(0);
});