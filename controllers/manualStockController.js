const db = require('../db/connection');

// Manual Stock Update Controller
const updateStockManually = (req, res) => {
    const {
        product_id,
        barcode,
        warehouse,
        adjustment_type, // 'adjustment', 'in', 'out', 'damage', 'return', 'transfer'
        quantity,
        reason,
        notes,
        current_stock
    } = req.body;

    // Validate required fields
    if (!barcode || !warehouse || !adjustment_type || !quantity || !reason) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: barcode, warehouse, adjustment_type, quantity, reason'
        });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
        return res.status(400).json({
            success: false,
            message: 'Quantity must be a valid positive number'
        });
    }

    console.log('📦 Manual stock update request:', {
        barcode,
        warehouse,
        adjustment_type,
        quantity: qty,
        reason,
        current_stock
    });

    // Start transaction
    db.beginTransaction(err => {
        if (err) {
            console.error('❌ Transaction start error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to start transaction',
                error: err.message
            });
        }

        // 1. Find the product in stock_batches (same as frontend)
        const findStockSql = `
            SELECT
                barcode,
                product_name,
                variant,
                warehouse,
                SUM(qty_available) AS stock,
                MAX(created_at) AS updated_at
            FROM stock_batches
            WHERE barcode = ? AND warehouse = ? AND status = 'active'
            GROUP BY barcode, product_name, variant, warehouse
            LIMIT 1
        `;

        db.query(findStockSql, [barcode, warehouse], (err, stockRows) => {
            if (err) {
                console.error('❌ Find stock error:', err);
                return db.rollback(() => {
                    res.status(500).json({
                        success: false,
                        message: 'Failed to find stock record',
                        error: err.message
                    });
                });
            }

            console.log('🔍 Database query result:', {
                rowCount: stockRows.length,
                firstRow: stockRows.length > 0 ? stockRows[0] : null
            });

            let currentStock = 0;
            let newStock = 0;
            let stockExists = stockRows.length > 0;

            if (stockExists) {
                const stockValue = stockRows[0].stock;
                console.log('📊 Raw stock value from DB:', stockValue, 'Type:', typeof stockValue);
                currentStock = parseInt(stockValue || 0);
                console.log('📊 Parsed currentStock:', currentStock);
            } else {
                console.log('⚠️  No stock record found for barcode:', barcode, 'warehouse:', warehouse);
            }

            // 2. Calculate new stock based on adjustment type
            console.log('📊 Stock calculation input:', {
                currentStock,
                adjustment_type,
                quantity: qty
            });

            switch (adjustment_type) {
                case 'adjustment':
                    newStock = qty; // Direct stock level set
                    break;
                case 'in':
                    newStock = currentStock + qty; // Add to current stock
                    break;
                case 'out':
                    newStock = Math.max(0, currentStock - qty); // Remove from stock (min 0)
                    break;
                case 'damage':
                    newStock = Math.max(0, currentStock - qty); // Remove damaged stock
                    break;
                case 'return':
                    newStock = currentStock + qty; // Add returned stock
                    break;
                case 'transfer':
                    newStock = Math.max(0, currentStock - qty); // Remove transferred stock
                    break;
                default:
                    return db.rollback(() => {
                        res.status(400).json({
                            success: false,
                            message: 'Invalid adjustment type'
                        });
                    });
            }

            console.log('📊 Stock calculation result:', {
                currentStock,
                adjustment_type,
                quantity: qty,
                newStock,
                calculation: `${currentStock} ${adjustment_type === 'in' ? '+' : adjustment_type === 'out' ? '-' : '='} ${qty} = ${newStock}`
            });

            // 3. Update stock in stock_batches table
            const updateStock = () => {
                if (stockExists) {
                    // For existing stock, update the existing batches proportionally
                    // This is more appropriate than creating new batches
                    
                    // Calculate the adjustment quantity (difference between new and current stock)
                    const adjustmentQty = newStock - currentStock;
                    
                    if (adjustmentQty !== 0) {
                        console.log('📦 Updating existing stock batches:', {
                            barcode,
                            warehouse,
                            currentStock,
                            adjustmentQty,
                            newStock
                        });
                        
                        // Get all active batches for this product
                        const getBatchesSql = `
                            SELECT id, qty_available 
                            FROM stock_batches 
                            WHERE barcode = ? AND warehouse = ? AND status = 'active' AND qty_available > 0
                            ORDER BY created_at ASC
                        `;
                        
                        db.query(getBatchesSql, [barcode, warehouse], (err, batches) => {
                            if (err) {
                                console.error('❌ Get batches error:', err);
                                return db.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        message: 'Failed to get stock batches',
                                        error: err.message
                                    });
                                });
                            }
                            
                            if (batches.length === 0) {
                                console.log('⚠️  No active batches found, creating new batch');
                                createNewBatch();
                                return;
                            }
                            
                            // Update batches proportionally
                            let remainingAdjustment = adjustmentQty;
                            let batchUpdates = [];
                            
                            if (adjustmentQty > 0) {
                                // For positive adjustments (stock in), add to the first batch
                                const firstBatch = batches[0];
                                const newQty = firstBatch.qty_available + adjustmentQty;
                                batchUpdates.push({
                                    id: firstBatch.id,
                                    newQty: newQty
                                });
                            } else {
                                // For negative adjustments (stock out), reduce from batches FIFO
                                for (let batch of batches) {
                                    if (remainingAdjustment >= 0) break;
                                    
                                    const reduction = Math.min(batch.qty_available, Math.abs(remainingAdjustment));
                                    const newQty = batch.qty_available - reduction;
                                    
                                    batchUpdates.push({
                                        id: batch.id,
                                        newQty: newQty
                                    });
                                    
                                    remainingAdjustment += reduction;
                                }
                            }
                            
                            // Execute batch updates
                            let updatesCompleted = 0;
                            const totalUpdates = batchUpdates.length;
                            
                            if (totalUpdates === 0) {
                                console.log('⚠️  No batch updates needed');
                                logAdjustments();
                                return;
                            }
                            
                            for (let update of batchUpdates) {
                                const updateBatchSql = `
                                    UPDATE stock_batches 
                                    SET qty_available = ?, 
                                        status = CASE WHEN ? = 0 THEN 'exhausted' ELSE 'active' END
                                    WHERE id = ?
                                `;
                                
                                db.query(updateBatchSql, [update.newQty, update.newQty, update.id], (err) => {
                                    if (err) {
                                        console.error('❌ Update batch error:', err);
                                        return db.rollback(() => {
                                            res.status(500).json({
                                                success: false,
                                                message: 'Failed to update stock batch',
                                                error: err.message
                                            });
                                        });
                                    }
                                    
                                    updatesCompleted++;
                                    if (updatesCompleted === totalUpdates) {
                                        // All updates completed, verify and continue
                                        db.query(findStockSql, [barcode, warehouse], (err, verifyRows) => {
                                            if (!err && verifyRows.length > 0) {
                                                const actualStock = parseInt(verifyRows[0].stock || 0);
                                                console.log('✅ Stock updated. Verification:', {
                                                    expectedStock: newStock,
                                                    actualStock: actualStock,
                                                    match: actualStock === newStock
                                                });
                                            }
                                            logAdjustments();
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        console.log('⚠️  No stock change needed');
                        logAdjustments();
                    }
                } else {
                    // Create new stock record if it doesn't exist
                    createNewBatch();
                }
            };
            
            // Helper function to create new batch
            const createNewBatch = () => {
                const findProductSql = `SELECT product_name FROM products WHERE barcode = ? LIMIT 1`;
                
                db.query(findProductSql, [barcode], (err, productRows) => {
                    const productName = (productRows && productRows.length > 0) ? productRows[0].product_name : 'Unknown Product';
                    
                    const insertBatchSql = `
                        INSERT INTO stock_batches (
                            product_name, barcode, variant, warehouse, 
                            source_type, qty_initial, qty_available, 
                            unit_cost, status, created_at
                        ) VALUES (?, ?, '', ?, 'SELF_TRANSFER', ?, ?, 0.00, 'active', NOW())
                    `;
                    
                    db.query(insertBatchSql, [productName, barcode, warehouse, newStock, newStock], (err) => {
                        if (err) {
                            console.error('❌ Insert new stock batch error:', err);
                            return db.rollback(() => {
                                res.status(500).json({
                                    success: false,
                                    message: 'Failed to create stock record',
                                    error: err.message
                                });
                            });
                        }
                        logAdjustments();
                    });
                });
            };

            // 4. Log the adjustment in inventory_adjustments table
            const logAdjustments = () => {
                const adjustmentSql = `
                    INSERT INTO inventory_adjustments 
                    (product_type, barcode, warehouse, adjustment_type, quantity, timestamp)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `;

                db.query(adjustmentSql, [reason, barcode, warehouse, adjustment_type, qty], (err) => {
                    if (err) {
                        console.error('❌ Log adjustment error:', err);
                        return db.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: 'Failed to log adjustment',
                                error: err.message
                            });
                        });
                    }
                    logTransaction();
                });
            };

            // 5. Log in stock_transactions table (only if we have a valid product_id)
            const logTransaction = () => {
                // Skip stock_transactions logging for now since products table schema varies
                // This is not critical for manual stock updates to work
                console.log('⚠️  Skipping stock_transactions logging (products table schema varies)');
                logLedger();
            };

            // 6. Log in inventory_ledger_base for timeline tracking
            const logLedger = () => {
                const direction = (adjustment_type === 'in' || adjustment_type === 'return') ? 'IN' : 'OUT';
                const movementType = `MANUAL_${adjustment_type.toUpperCase()}`;
                
                const ledgerSql = `
                    INSERT INTO inventory_ledger_base 
                    (event_time, movement_type, barcode, product_name, location_code, qty, direction, reference, created_at)
                    VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, NOW())
                `;

                const productName = stockExists ? stockRows[0].product_name : 'Unknown Product';
                const reference = `MANUAL_UPDATE_${Date.now()}`;

                db.query(ledgerSql, [movementType, barcode, productName, warehouse, qty, direction, reference], (err) => {
                    if (err) {
                        console.error('❌ Log ledger error:', err);
                        return db.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: 'Failed to log ledger entry',
                                error: err.message
                            });
                        });
                    }

                    // Commit transaction
                    db.commit(err => {
                        if (err) {
                            console.error('❌ Commit error:', err);
                            return db.rollback(() => {
                                res.status(500).json({
                                    success: false,
                                    message: 'Failed to commit transaction',
                                    error: err.message
                                });
                            });
                        }

                        console.log('✅ Manual stock update completed:', {
                            barcode,
                            warehouse,
                            oldStock: currentStock,
                            newStock,
                            adjustment_type,
                            quantity: qty
                        });

                        res.json({
                            success: true,
                            message: 'Stock updated successfully',
                            data: {
                                barcode,
                                warehouse,
                                old_stock: currentStock,
                                new_stock: newStock,
                                adjustment_type,
                                quantity: qty,
                                reason,
                                notes
                            },
                            new_stock: newStock
                        });
                    });
                });
            };

            // Start the update process
            updateStock();
        });
    });
};

// Get stock update history for a product
const getStockUpdateHistory = (req, res) => {
    const { barcode, warehouse } = req.query;
    
    if (!barcode) {
        return res.status(400).json({
            success: false,
            message: 'Barcode is required'
        });
    }

    let query = `
        SELECT 
            ia.id,
            ia.adjustment_type,
            ia.quantity,
            ia.timestamp,
            ia.product_type as reason,
            ilb.movement_type,
            ilb.direction,
            ilb.reference,
            ilb.event_time
        FROM inventory_adjustments ia
        LEFT JOIN inventory_ledger_base ilb ON ia.barcode = ilb.barcode 
            AND DATE(ia.timestamp) = DATE(ilb.event_time)
        WHERE ia.barcode = ?
    `;
    
    const params = [barcode];
    
    if (warehouse) {
        query += ' AND ia.warehouse = ?';
        params.push(warehouse);
    }
    
    query += ' ORDER BY ia.timestamp DESC LIMIT 50';

    db.query(query, params, (err, rows) => {
        if (err) {
            console.error('❌ Error fetching stock update history:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch stock update history',
                error: err.message
            });
        }

        res.json({
            success: true,
            data: rows,
            total: rows.length
        });
    });
};

module.exports = {
    updateStockManually,
    getStockUpdateHistory
};