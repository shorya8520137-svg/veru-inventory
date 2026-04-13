const db = require('./db/connection');

console.log('🔧 Fixing inventory_adjustments.adjustment_type column...');

// First check current schema
db.query('DESCRIBE inventory_adjustments', (err, results) => {
    if (err) {
        console.error('❌ Error checking schema:', err);
        return;
    }
    
    console.log('📋 Current schema:');
    console.table(results);
    
    // Find the adjustment_type column
    const adjustmentTypeColumn = results.find(col => col.Field === 'adjustment_type');
    if (adjustmentTypeColumn) {
        console.log('🔍 Current adjustment_type column:', adjustmentTypeColumn.Type);
        
        // Check if it's an ENUM that needs to be expanded
        if (adjustmentTypeColumn.Type.includes('enum(')) {
            console.log('📝 Column is ENUM type, converting to VARCHAR to support manual stock updates...');
            
            // Convert ENUM to VARCHAR(20) to support all our adjustment types
            db.query('ALTER TABLE inventory_adjustments MODIFY COLUMN adjustment_type VARCHAR(20) NOT NULL', (err) => {
                if (err) {
                    console.error('❌ Error converting ENUM to VARCHAR:', err);
                    return;
                }
                
                console.log('✅ Successfully converted adjustment_type from ENUM to VARCHAR(20)');
                console.log('✅ Now supports: adjustment, in, out, damage, return, transfer');
                
                // Verify the change
                db.query('DESCRIBE inventory_adjustments', (err, results) => {
                    if (err) {
                        console.error('❌ Error verifying change:', err);
                        return;
                    }
                    
                    const updatedColumn = results.find(col => col.Field === 'adjustment_type');
                    console.log('✅ Updated adjustment_type column:', updatedColumn.Type);
                    
                    console.log('🎯 Schema fix completed! Manual stock updates should now work.');
                    process.exit(0);
                });
            });
        } else if (adjustmentTypeColumn.Type.includes('char(') || adjustmentTypeColumn.Type.includes('varchar(')) {
            const match = adjustmentTypeColumn.Type.match(/\((\d+)\)/);
            const currentSize = match ? parseInt(match[1]) : 0;
            
            if (currentSize < 20) {
                console.log(`📏 Current size: ${currentSize}, expanding to 20...`);
                
                // Expand the column
                db.query('ALTER TABLE inventory_adjustments MODIFY COLUMN adjustment_type VARCHAR(20) NOT NULL', (err) => {
                    if (err) {
                        console.error('❌ Error expanding column:', err);
                        return;
                    }
                    
                    console.log('✅ Successfully expanded adjustment_type column to VARCHAR(20)');
                    
                    // Verify the change
                    db.query('DESCRIBE inventory_adjustments', (err, results) => {
                        if (err) {
                            console.error('❌ Error verifying change:', err);
                            return;
                        }
                        
                        const updatedColumn = results.find(col => col.Field === 'adjustment_type');
                        console.log('✅ Updated adjustment_type column:', updatedColumn.Type);
                        
                        console.log('🎯 Schema fix completed! Manual stock updates should now work.');
                        process.exit(0);
                    });
                });
            } else {
                console.log('✅ Column size is already sufficient:', adjustmentTypeColumn.Type);
                process.exit(0);
            }
        } else if (adjustmentTypeColumn.Type.includes('varchar(20)') || 
                   adjustmentTypeColumn.Type.includes('varchar(255)') ||
                   adjustmentTypeColumn.Type.includes('text')) {
            console.log('✅ Column is already suitable for manual stock updates:', adjustmentTypeColumn.Type);
            process.exit(0);
        } else {
            console.log('⚠️  Unexpected column type:', adjustmentTypeColumn.Type);
            console.log('❌ Cannot automatically fix this column type. Manual intervention required.');
            process.exit(1);
        }
    } else {
        console.error('❌ adjustment_type column not found!');
        process.exit(1);
    }
});