const db = require('../db/connection');
const ProductionEventAuditLogger = require('../ProductionEventAuditLogger');

// Initialize production event audit logger
const eventAuditLogger = new ProductionEventAuditLogger();

/**
 * =====================================================
 * RETURNS CONTROLLER - Handles return operations
 * Updates stock_batches and inventory_ledger_base
 * =====================================================
 */

/**
 * CREATE NEW RETURN - FIXED WITH TIMELINE INTEGRATION
 */
exports.createReturn = (req, res) => {
    const {
        return_type = 'WAREHOUSE',    // 'WAREHOUSE' or 'STORE'
        source_location,              // warehouse code or store code
        destination_location,         // where return goes (usually warehouse)
        order_ref,
        awb,
        product_type,
        quantity = 1,
        barcode,
        condition = 'good',          // 'good', 'damaged', 'defective'
        return_reason,
        original_dispatch_id,        // link to original dispatch
        processed_by,                // user ID who processed
        notes,
        has_parts = false,
        parts = [],                  // array of return parts
        // Legacy support
        warehouse
    } = req.body;

    // Support legacy warehouse parameter
    const finalSourceLocation = source_location || warehouse;
    const finalDestination = destination_location || finalSourceLocation;

    // Enhanced validation
    if (!return_type || !finalSourceLocation || !barcode || !product_type) {
        return res.status(400).json({
            success: false,
            message: 'return_type, source_location (or warehouse), barcode, and product_type are required'
        });
    }

    if (!['WAREHOUSE', 'STORE'].includes(return_type)) {
        return res.status(400).json({
            success: false,
            message: 'return_type must be either WAREHOUSE or STORE'
        });
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
        return res.status(400).json({
            success: false,
            message: 'quantity must be greater than 0'
        });
    }

    console.log(`🔄 Creating ${return_type} return: ${finalSourceLocation} → ${finalDestination}`);

    db.beginTransaction(err => {
        if (err) {
            console.error('❌ Transaction start failed:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        // Step 1: Create return record with new schema
        const returnSql = `
            INSERT INTO returns_main (
                return_type, source_location, destination_location,
                order_ref, awb, product_type, warehouse, quantity, barcode, 
                \`condition\`, return_reason, original_dispatch_id,
                processed_by, notes, has_parts, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        db.query(returnSql, [
            return_type, finalSourceLocation, finalDestination,
            order_ref, awb, product_type, finalSourceLocation, qty, barcode,
            condition, return_reason, original_dispatch_id,
            processed_by, notes, has_parts
        ], (err, returnResult) => {
            if (err) {
                console.error('❌ Error creating return record:', err);
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            const returnId = returnResult.insertId;
            console.log(`✅ Return record created with ID: ${returnId}`);

            // Step 2: Update stock if condition is good
            if (condition === 'good') {
                updateStockForReturn(barcode, product_type, finalDestination, qty, returnId, (err) => {
                    if (err) {
                        console.error('❌ Error updating stock:', err);
                        return db.rollback(() =>
                            res.status(500).json({ success: false, error: err.message })
                        );
                    }
                    createTimelineEntries();
                });
            } else {
                createTimelineEntries();
            }

            function createTimelineEntries() {
                // Step 3: Create appropriate timeline entries based on return type
                if (return_type === 'WAREHOUSE') {
                    createWarehouseTimelineEntry(returnId, barcode, product_type, finalSourceLocation, finalDestination, qty, condition, (err) => {
                        if (err) {
                            console.error('❌ Error creating warehouse timeline:', err);
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }
                        finalizeReturn();
                    });
                } else if (return_type === 'STORE') {
                    createStoreTimelineEntry(returnId, barcode, product_type, finalSourceLocation, qty, condition, (err) => {
                        if (err) {
                            console.error('❌ Error creating store timeline:', err);
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }
                        // Also create warehouse timeline if destination is different
                        if (finalDestination !== finalSourceLocation) {
                            createWarehouseTimelineEntry(returnId, barcode, product_type, finalSourceLocation, finalDestination, qty, condition, (err) => {
                                if (err) {
                                    console.error('❌ Error creating warehouse timeline for store return:', err);
                                    return db.rollback(() =>
                                        res.status(500).json({ success: false, error: err.message })
                                    );
                                }
                                finalizeReturn();
                            });
                        } else {
                            finalizeReturn();
                        }
                    });
                }
            }

            function finalizeReturn() {
                // Step 4: Update return status to processed
                const updateStatusSql = `UPDATE returns_main SET status = 'processed', processed_at = NOW() WHERE id = ?`;

                db.query(updateStatusSql, [returnId], (err) => {
                    if (err) {
                        console.error('❌ Error updating return status:', err);
                        return db.rollback(() =>
                            res.status(500).json({ success: false, error: err.message })
                        );
                    }

                    // Step 5: Log audit event
                    if (req && req.user) {
                        eventAuditLogger.logEvent('RETURN_CREATED', {
                            return_id: returnId,
                            return_type,
                            source_location: finalSourceLocation,
                            destination_location: finalDestination,
                            barcode,
                            quantity: qty,
                            condition,
                            user_id: processed_by || req.user.id
                        });
                    }

                    // Step 6: Commit transaction
                    db.commit((err) => {
                        if (err) {
                            console.error('❌ Transaction commit failed:', err);
                            return db.rollback(() =>
                                res.status(500).json({ success: false, message: err.message })
                            );
                        }

                        console.log(`✅ Return ${returnId} processed successfully`);

                        res.status(201).json({
                            success: true,
                            message: 'Return created and processed successfully',
                            return_id: returnId,
                            return_type,
                            source_location: finalSourceLocation,
                            destination_location: finalDestination,
                            status: 'processed',
                            condition,
                            stock_added: condition === 'good',
                            timeline_entries_created: return_type === 'STORE' && finalDestination !== finalSourceLocation ? 2 : 1
                        });
                    });
                });
            }
        });
    });
};

/**
 * Helper function to add ledger entry and commit transaction
 */
function addLedgerEntryAndCommit(returnId, barcode, product_type, warehouse, qty, awb, res, db, condition = 'good', req = null) {
    const ledgerSql = `
        INSERT INTO inventory_ledger_base (
            event_time, movement_type, barcode, product_name,
            location_code, qty, direction, reference
        ) VALUES (NOW(), ?, ?, ?, ?, ?, 'IN', ?)
    `;

    const movementType = condition === 'good' ? 'RETURN' : `RETURN_${condition.toUpperCase()}`;
    const reference = `RETURN_${returnId}_${awb || 'NO_AWB'}`;

    db.query(ledgerSql, [
        movementType, barcode, product_type, warehouse, qty, reference
    ], (err) => {
        if (err) {
            return db.rollback(() =>
                res.status(500).json({ success: false, error: err.message })
            );
        }

        // Commit transaction
        db.commit(err => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, message: err.message })
                );
            }

            // Log RETURN audit AFTER successful commit
            if (req && req.user) {
                console.log('🔍 DEBUG: About to create return audit log');
                console.log('🔍 req.user:', req.user);
                
                // Use ProductionEventAuditLogger for consistent audit logging
                eventAuditLogger.logReturnCreate(req, req.user.id, {
                    return_id: returnId,
                    product_name: product_type,
                    quantity: qty,
                    reason: req.body.return_reason || 'Return processed',
                    awb: awb,
                    condition: condition
                });
            }

            res.status(201).json({
                success: true,
                message: `Return processed successfully${condition !== 'good' ? ` (${condition} - no stock added)` : ''}`,
                return_id: returnId,
                quantity_returned: qty,
                condition,
                stock_added: condition === 'good',
                reference
            });
        });
    });
}

/**
 * GET ALL RETURNS WITH FILTERS
 */
exports.getReturns = (req, res) => {
    const {
        warehouse,
        dateFrom,
        dateTo,
        search,
        page = 1,
        limit = 50
    } = req.query;

    const filters = [];
    const values = [];

    if (warehouse) {
        filters.push('warehouse = ?');
        values.push(warehouse);
    }

    if (dateFrom) {
        filters.push('submitted_at >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('submitted_at <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    if (search) {
        filters.push('(product_type LIKE ? OR barcode LIKE ? OR awb LIKE ? OR order_ref LIKE ?)');
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const sql = `
        SELECT *
        FROM returns_main
        ${whereClause}
        ORDER BY submitted_at DESC
        LIMIT ? OFFSET ?
    `;

    values.push(parseInt(limit), parseInt(offset));

    db.query(sql, values, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM returns_main ${whereClause}`;
        const countValues = values.slice(0, -2); // Remove limit and offset

        db.query(countSql, countValues, (err, countResult) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            const total = countResult[0].total;

            res.json({
                success: true,
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        });
    });
};

/**
 * GET RETURN BY ID
 */
exports.getReturnById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT r.*, 
               il.reference as ledger_reference,
               il.event_time as processed_at
        FROM returns_main r
        LEFT JOIN inventory_ledger_base il ON il.reference LIKE CONCAT('RETURN_', r.id, '%')
        WHERE r.id = ?
    `;

    db.query(sql, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Return not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    });
};

/**
 * GET PRODUCT SUGGESTIONS FOR RETURNS
 */
exports.getProductSuggestions = (req, res) => {
    const { search, q } = req.query;
    const searchTerm = search || q; // Support both 'search' and 'q' parameters

    if (!searchTerm || searchTerm.length < 2) {
        return res.json([]);
    }

    // Use dispatch_product table for consistency
    const sql = `
        SELECT p_id, product_name, product_variant, barcode
        FROM dispatch_product 
        WHERE is_active = 1 
        AND (product_name LIKE ? OR barcode LIKE ? OR product_variant LIKE ?)
        ORDER BY product_name
        LIMIT 10
    `;

    const searchPattern = `%${searchTerm}%`;

    db.query(sql, [searchPattern, searchPattern, searchPattern], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json(rows);
    });
};

/**
 * GET WAREHOUSES - For dropdown
 */
exports.getWarehouses = (req, res) => {
    const sql = `SELECT warehouse_code FROM dispatch_warehouse ORDER BY Warehouse_name`;

    db.query(sql, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        const warehouses = rows.map(row => row.warehouse_code);
        res.json(warehouses);
    });
};

/**
 * BULK RETURN PROCESSING
 */
exports.processBulkReturns = (req, res) => {
    const { returns } = req.body;

    if (!Array.isArray(returns) || returns.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'returns array is required and must not be empty'
        });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        let processedCount = 0;
        const results = [];
        const totalReturns = returns.length;

        returns.forEach((returnItem, index) => {
            const {
                order_ref,
                awb,
                product_type,
                warehouse,
                quantity = 1,
                barcode,
                condition = 'good'
            } = returnItem;

            // Validate each return
            if (!product_type || !warehouse || !barcode) {
                results.push({
                    index,
                    success: false,
                    message: 'product_type, warehouse, barcode are required'
                });
                processedCount++;
                
                if (processedCount === totalReturns) {
                    completeBulkReturn(results, res, db);
                }
                return;
            }

            // Process individual return (simplified version)
            const returnSql = `
                INSERT INTO returns_main (
                    order_ref, awb, product_type, warehouse, quantity, barcode
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(returnSql, [
                order_ref, awb, product_type, warehouse, parseInt(quantity), barcode
            ], (err, returnResult) => {
                if (err) {
                    results.push({
                        index,
                        success: false,
                        error: err.message
                    });
                } else {
                    results.push({
                        index,
                        success: true,
                        return_id: returnResult.insertId,
                        message: 'Return processed successfully'
                    });
                }

                processedCount++;
                
                if (processedCount === totalReturns) {
                    completeBulkReturn(results, res, db);
                }
            });
        });
    });
};

function completeBulkReturn(results, res, db) {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    if (failureCount === 0) {
        db.commit(err => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, message: err.message })
                );
            }

            res.json({
                success: true,
                message: `All ${successCount} returns processed successfully`,
                results
            });
        });
    } else {
        db.rollback(() => {
            res.status(400).json({
                success: false,
                message: `${failureCount} returns failed, ${successCount} would have succeeded`,
                results
            });
        });
    }
}


/**
 * =====================================================
 * HELPER FUNCTIONS FOR TIMELINE INTEGRATION
 * =====================================================
 */

/**
 * Update stock for returns
 */
function updateStockForReturn(barcode, productName, warehouse, qty, returnId, callback) {
    // Check if there's an existing active batch for this product
    const findBatchSql = `
        SELECT id, qty_available 
        FROM stock_batches 
        WHERE barcode = ? AND warehouse = ? AND product_name = ? AND status = 'active'
        ORDER BY created_at DESC 
        LIMIT 1
    `;

    db.query(findBatchSql, [barcode, warehouse, productName], (err, batches) => {
        if (err) return callback(err);

        if (batches.length > 0) {
            // Update existing batch
            const batch = batches[0];
            const newQty = batch.qty_available + qty;

            const updateBatchSql = `
                UPDATE stock_batches 
                SET qty_available = ?, status = 'active', updated_at = NOW()
                WHERE id = ?
            `;

            db.query(updateBatchSql, [newQty, batch.id], (err) => {
                if (err) return callback(err);
                console.log(`✅ Updated existing batch ${batch.id}: +${qty} units (new total: ${newQty})`);
                callback(null);
            });
        } else {
            // Create new batch for return
            const createBatchSql = `
                INSERT INTO stock_batches (
                    barcode, product_name, warehouse, 
                    qty_initial, qty_available, status,
                    source_type, source_ref_id, tenant_id
                ) VALUES (?, ?, ?, ?, ?, 'active', 'RETURN', ?, 1)
            `;

            db.query(createBatchSql, [
                barcode, productName, warehouse, qty, qty, returnId
            ], (err, result) => {
                if (err) return callback(err);
                console.log(`✅ Created new return batch ${result.insertId}: ${qty} units`);
                callback(null);
            });
        }
    });
}

/**
 * Create warehouse timeline entry
 */
function createWarehouseTimelineEntry(returnId, barcode, productName, sourceLocation, destinationLocation, qty, condition, callback) {
    const movementType = condition === 'good' ? 'RETURN' : `RETURN_${condition.toUpperCase()}`;
    const reference = `RETURN_${returnId}_${sourceLocation}_${destinationLocation}`;

    const timelineSql = `
        INSERT INTO inventory_ledger_base (
            event_time, movement_type, barcode, product_name,
            location_code, qty, direction, reference, tenant_id
        ) VALUES (NOW(), ?, ?, ?, ?, ?, 'IN', ?, 1)
    `;

    db.query(timelineSql, [
        movementType, barcode, productName, destinationLocation, qty, reference
    ], (err, result) => {
        if (err) return callback(err);
        console.log(`✅ Created warehouse timeline entry ${result.insertId}: ${movementType} IN ${qty} units to ${destinationLocation}`);
        callback(null);
    });
}

/**
 * Create store timeline entry
 */
function createStoreTimelineEntry(returnId, barcode, productName, storeCode, qty, condition, callback) {
    // Get current balance for this product in this store
    const balanceSql = `
        SELECT COALESCE(SUM(
            CASE 
                WHEN direction = 'IN' THEN quantity 
                WHEN direction = 'OUT' THEN -quantity 
                ELSE 0 
            END
        ), 0) as current_balance
        FROM store_timeline
        WHERE store_code = ? AND product_barcode = ?
    `;

    db.query(balanceSql, [storeCode, barcode], (err, result) => {
        if (err) return callback(err);

        const currentBalance = result[0]?.current_balance || 0;
        const newBalance = currentBalance + qty;
        const reference = `RETURN_${returnId}_${storeCode}`;

        const timelineSql = `
            INSERT INTO store_timeline (
                store_code, product_barcode, product_name,
                movement_type, direction, quantity, balance_after, reference, created_at
            ) VALUES (?, ?, ?, 'RETURN', 'IN', ?, ?, ?, NOW())
        `;

        db.query(timelineSql, [
            storeCode, barcode, productName, qty, newBalance, reference
        ], (err, result) => {
            if (err) return callback(err);
            console.log(`✅ Created store timeline entry ${result.insertId}: RETURN IN ${qty} units to ${storeCode} (balance: ${newBalance})`);
            callback(null);
        });
    });
}

/**
 * GET RETURN TIMELINE - Shows complete audit trail
 */
exports.getReturnTimeline = (req, res) => {
    const { returnId } = req.params;

    if (!returnId) {
        return res.status(400).json({
            success: false,
            message: 'Return ID is required'
        });
    }

    // Get return details first
    const returnSql = `SELECT * FROM returns_main WHERE id = ?`;

    db.query(returnSql, [returnId], (err, returnData) => {
        if (err) {
            console.error('Error fetching return:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch return',
                error: err.message
            });
        }

        if (returnData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Return not found'
            });
        }

        const returnInfo = returnData[0];

        // Get timeline entries for this return
        const timelineSql = `
            (
                SELECT 
                    'warehouse' as timeline_type,
                    ilb.id,
                    ilb.event_time as timestamp,
                    ilb.movement_type,
                    ilb.barcode,
                    ilb.product_name,
                    ilb.location_code,
                    ilb.qty as quantity,
                    ilb.direction,
                    ilb.reference,
                    NULL as balance_after
                FROM inventory_ledger_base ilb
                WHERE ilb.reference LIKE ?
            )
            UNION ALL
            (
                SELECT 
                    'store' as timeline_type,
                    st.id,
                    st.created_at as timestamp,
                    st.movement_type,
                    st.product_barcode as barcode,
                    st.product_name,
                    st.store_code as location_code,
                    st.quantity,
                    st.direction,
                    st.reference,
                    st.balance_after
                FROM store_timeline st
                WHERE st.reference LIKE ?
            )
            ORDER BY timestamp DESC
        `;

        const referencePattern = `%RETURN_${returnId}%`;

        db.query(timelineSql, [referencePattern, referencePattern], (err, timeline) => {
            if (err) {
                console.error('Error fetching return timeline:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch return timeline',
                    error: err.message
                });
            }

            res.json({
                success: true,
                return_info: returnInfo,
                timeline: timeline
            });
        });
    });
};

/**
 * CLEAR ALL RETURN DATA - For testing purposes only
 */
exports.clearAllReturnData = (req, res) => {
    const { confirm } = req.body;

    if (confirm !== 'YES_DELETE_ALL_RETURNS') {
        return res.status(400).json({
            success: false,
            message: 'Must provide confirm: "YES_DELETE_ALL_RETURNS" to proceed'
        });
    }

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        // Step 1: Delete return parts
        db.query('DELETE FROM return_parts', (err) => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            // Step 2: Delete return timeline entries
            db.query('DELETE FROM inventory_ledger_base WHERE movement_type LIKE "RETURN%"', (err) => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, error: err.message })
                    );
                }

                // Step 3: Delete store timeline return entries
                db.query('DELETE FROM store_timeline WHERE movement_type = "RETURN"', (err) => {
                    if (err) {
                        return db.rollback(() =>
                            res.status(500).json({ success: false, error: err.message })
                        );
                    }

                    // Step 4: Delete return stock batches
                    db.query('DELETE FROM stock_batches WHERE source_type = "RETURN"', (err) => {
                        if (err) {
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }

                        // Step 5: Delete returns_main records
                        db.query('DELETE FROM returns_main', (err) => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, error: err.message })
                                );
                            }

                            // Step 6: Reset auto-increment
                            db.query('ALTER TABLE returns_main AUTO_INCREMENT = 1', (err) => {
                                if (err) {
                                    return db.rollback(() =>
                                        res.status(500).json({ success: false, error: err.message })
                                    );
                                }

                                db.commit((err) => {
                                    if (err) {
                                        return db.rollback(() =>
                                            res.status(500).json({ success: false, message: err.message })
                                        );
                                    }

                                    console.log('✅ All return data cleared successfully');

                                    res.json({
                                        success: true,
                                        message: 'All return data cleared successfully',
                                        cleared: [
                                            'return_parts',
                                            'inventory_ledger_base (RETURN entries)',
                                            'store_timeline (RETURN entries)',
                                            'stock_batches (RETURN source)',
                                            'returns_main'
                                        ]
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
