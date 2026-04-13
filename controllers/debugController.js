const db = require('../db/connection');

/**
 * DEBUG CONTROLLER
 * Temporary controller to debug dispatch dimensions issue
 */

exports.testDispatchDimensions = (req, res) => {
    const barcode = req.params.barcode || '638-30500';
    
    console.log('🧪 Debug: Testing dispatch dimensions for barcode:', barcode);
    
    const results = {
        barcode: barcode,
        tests: []
    };
    
    // Test 1: Check warehouse_dispatch table structure
    db.query('DESCRIBE warehouse_dispatch', (err, structure) => {
        if (err) {
            results.tests.push({
                test: 'Table Structure',
                status: 'ERROR',
                error: err.message
            });
            return res.json(results);
        }
        
        const dimensionColumns = structure.filter(col => 
            col.Field.includes('length') || 
            col.Field.includes('width') || 
            col.Field.includes('height') || 
            col.Field.includes('weight')
        );
        
        results.tests.push({
            test: 'Table Structure',
            status: 'SUCCESS',
            data: dimensionColumns
        });
        
        // Test 2: Check actual dispatch data
        db.query(`
            SELECT id, customer, awb, barcode, length, width, height, actual_weight, timestamp
            FROM warehouse_dispatch 
            WHERE barcode = ?
            ORDER BY id DESC 
            LIMIT 3
        `, [barcode], (err, dispatches) => {
            if (err) {
                results.tests.push({
                    test: 'Dispatch Data',
                    status: 'ERROR',
                    error: err.message
                });
                return res.json(results);
            }
            
            results.tests.push({
                test: 'Dispatch Data',
                status: 'SUCCESS',
                count: dispatches.length,
                data: dispatches
            });
            
            // Test 3: Check inventory ledger references
            db.query(`
                SELECT reference, movement_type, qty, event_time 
                FROM inventory_ledger_base 
                WHERE barcode = ? AND movement_type = 'DISPATCH'
                ORDER BY event_time DESC
                LIMIT 3
            `, [barcode], (err, ledgerEntries) => {
                if (err) {
                    results.tests.push({
                        test: 'Ledger Entries',
                        status: 'ERROR',
                        error: err.message
                    });
                    return res.json(results);
                }
                
                results.tests.push({
                    test: 'Ledger Entries',
                    status: 'SUCCESS',
                    count: ledgerEntries.length,
                    data: ledgerEntries
                });
                
                // Test 4: Test the JOIN query
                db.query(`
                    SELECT 
                        ilb.reference,
                        ilb.movement_type,
                        ilb.qty,
                        wd.id as dispatch_id,
                        wd.customer,
                        wd.awb,
                        wd.length,
                        wd.width,
                        wd.height,
                        wd.actual_weight
                    FROM inventory_ledger_base ilb
                    LEFT JOIN warehouse_dispatch wd ON (
                        ilb.movement_type = 'DISPATCH' 
                        AND ilb.reference LIKE CONCAT('DISPATCH_', wd.id, '%')
                    )
                    WHERE ilb.barcode = ? AND ilb.movement_type = 'DISPATCH'
                    ORDER BY ilb.event_time DESC
                    LIMIT 3
                `, [barcode], (err, joinResults) => {
                    if (err) {
                        results.tests.push({
                            test: 'JOIN Query',
                            status: 'ERROR',
                            error: err.message
                        });
                        return res.json(results);
                    }
                    
                    const successfulJoins = joinResults.filter(r => r.dispatch_id);
                    
                    results.tests.push({
                        test: 'JOIN Query',
                        status: 'SUCCESS',
                        total_results: joinResults.length,
                        successful_joins: successfulJoins.length,
                        data: joinResults
                    });
                    
                    // Summary
                    results.summary = {
                        dispatches_found: dispatches.length,
                        ledger_entries_found: ledgerEntries.length,
                        join_matches_found: successfulJoins.length,
                        issue_identified: successfulJoins.length === 0 ? 'JOIN not matching - check reference format' : 'Data looks good'
                    };
                    
                    res.json(results);
                });
            });
        });
    });
};

module.exports = exports;