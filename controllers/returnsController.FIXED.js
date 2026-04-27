const db = require('../db/connection');
const ProductionEventAuditLogger = require('../ProductionEventAuditLogger');
const TimelineService = require('../services/TimelineService');

// Initialize production event audit logger
const eventAuditLogger = new ProductionEventAuditLogger();
const timelineService = new TimelineService();

/**
 * =====================================================
 * FIXED RETURNS CONTROLLER - Complete Timeline Integration
 * Updates stock_batches, inventory_ledger_base, AND store_timeline
 * Properly tracks warehouse vs store returns
 * =====================================================
 */

/**
 * CREATE NEW RETURN - FIXED VERSION
 * Supports both warehouse and store returns with proper timeline integration
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
        parts = []                   // array of return parts
    } = req.body;

    // Enhanced validation
    if (!return_type || !source_location || !barcode || !product_type) {
        return res.status(400).json({
            success: false,
            message: 'return_type, source_location, barcode, and product_type are required'
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

    // Set default destination if not provided
    const finalDestination = destination_location || source_location;

    console.log(`🔄 Creating ${return_type} return: ${source_location} → ${finalDestination}`);

    db.beginTransaction(err => {
        if (err) {
            console.error('❌ Transaction start failed:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        // Step 1: Create return record
        const returnSql = `
            INSERT INTO returns_main (
                return_type, source_location, destination_location,
                order_ref, awb, product_type, quantity, barcode, 
                condition, return_reason, original_dispatch_id,
                processed_by, notes, has_parts, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        db.query(returnSql, [
            return_type, source_location, finalDestination,
            order_ref, awb, product_type, qty, barcode,
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

            // Step 2: Process return parts if any
            if (has_parts && parts && parts.length > 0) {
                processReturnParts(returnId, parts, (err) => {
                    if (err) {
                        console.error('❌ Error processing return parts:', err);
                        return db.rollback(() =>
                            res.status(500).json({ success: false, error: err.message })
                        );
                    }
                    continueReturnProcessing();
                });
            } else {
                continueReturnProcessing();
            }

            function continueReturnProcessing() {
                // Step 3: Update stock if condition is good
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
                    // For damaged/defective items, don't add stock but still create timeline
                    createTimelineEntries();
                }
            }

            function createTimelineEntries() {
                // Step 4: Create appropriate timeline entries based on return type
                if (return_type === 'WAREHOUSE') {
                    createWarehouseTimelineEntry(returnId, barcode, product_type, source_location, finalDestination, qty, condition, (err) => {
                        if (err) {
                            console.error('❌ Error creating warehouse timeline:', err);
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }
                        finalizeReturn();
                    });
                } else if (return_type === 'STORE') {
                    createStoreTimelineEntry(returnId, barcode, product_type, source_location, qty, condition, (err) => {
                        if (err) {
                            console.error('❌ Error creating store timeline:', err);
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }
                        // Also create warehouse timeline entry if destination is warehouse
                        if (finalDestination !== source_location) {
                            createWarehouseTimelineEntry(returnId, barcode, product_type, source_location, finalDestination, qty, condition, (err) => {
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
                // Step 5: Update return status to processed
                const updateStatusSql = `
                    UPDATE returns_main 
                    SET status = 'processed', processed_at = NOW() 
                    WHERE id = ?
                `;

                db.query(updateStatusSql, [returnId], (err) => {
                    if (err) {
                        console.error('❌ Error updating return status:', err);
                        return db.rollback(() =>
                            res.status(500).json({ success: false, error: err.message })
                        );
                    }

                    // Step 6: Log audit event
                    eventAuditLogger.logEvent('RETURN_CREATED', {
                        return_id: returnId,
                        return_type,
                        source_location,
                        destination_location: finalDestination,
                        barcode,
                        quantity: qty,
                        condition,
                        user_id: processed_by
                    });

                    // Step 7: Commit transaction
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
                            source_location,
                            destination_location: finalDestination,
                            status: 'processed',
                            timeline_entries_created: return_type === 'STORE' && finalDestination !== source_location ? 2 : 1
                        });
                    });
                });
            }
        });
    });
};

/**
 * Helper function to process return parts
 */
function processReturnParts(returnId, parts, callback) {
    if (!parts || parts.length === 0) {
        return callback(null);
    }

    let processedParts = 0;
    const totalParts = parts.length;

    parts.forEach(part => {
        const partSql = `
            INSERT INTO return_parts (
                return_id, part_name, part_barcode, quantity, condition, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(partSql, [
            returnId, part.part_name, part.part_barcode, 
            part.quantity, part.condition, part.notes
        ], (err) => {
            if (err) return callback(err);

            processedParts++;
            if (processedParts === totalParts) {
                callback(null);
            }
        });
    });
}

/**
 * Helper function to update stock for returns
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
 * Helper function to create warehouse timeline entry
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
 * Helper function to create store timeline entry
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
 * GET RETURNS WITH ENHANCED FILTERING
 */
exports.getReturns = (req, res) => {
    const {
        return_type,
        source_location,
        destination_location,
        status,
        condition,
        dateFrom,
        dateTo,
        search,
        page = 1,
        limit = 50
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE clause
    let whereConditions = ['1=1'];
    let queryParams = [];

    if (return_type) {
        whereConditions.push('rm.return_type = ?');
        queryParams.push(return_type);
    }

    if (source_location) {
        whereConditions.push('rm.source_location = ?');
        queryParams.push(source_location);
    }

    if (destination_location) {
        whereConditions.push('rm.destination_location = ?');
        queryParams.push(destination_location);
    }

    if (status) {
        whereConditions.push('rm.status = ?');
        queryParams.push(status);
    }

    if (condition) {
        whereConditions.push('rm.condition = ?');
        queryParams.push(condition);
    }

    if (dateFrom) {
        whereConditions.push('DATE(rm.submitted_at) >= ?');
        queryParams.push(dateFrom);
    }

    if (dateTo) {
        whereConditions.push('DATE(rm.submitted_at) <= ?');
        queryParams.push(dateTo);
    }

    if (search && search.trim()) {
        whereConditions.push('(rm.product_type LIKE ? OR rm.barcode LIKE ? OR rm.order_ref LIKE ? OR rm.awb LIKE ?)');
        const searchTerm = `%${search.trim()}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `
        SELECT COUNT(*) as total 
        FROM returns_main rm 
        WHERE ${whereClause}
    `;

    db.query(countSql, queryParams, (err, countResult) => {
        if (err) {
            console.error('Error getting returns count:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to get returns count',
                error: err.message
            });
        }

        const total = countResult[0].total;

        // Get returns with pagination
        const returnsSql = `
            SELECT 
                rm.*,
                u.name as processed_by_name,
                wd.customer as original_customer,
                wd.logistics as original_logistics
            FROM returns_main rm
            LEFT JOIN users u ON rm.processed_by = u.id
            LEFT JOIN warehouse_dispatch wd ON rm.original_dispatch_id = wd.id
            WHERE ${whereClause}
            ORDER BY rm.submitted_at DESC
            LIMIT ? OFFSET ?
        `;

        const paginationParams = [...queryParams, parseInt(limit), offset];

        db.query(returnsSql, paginationParams, (err, returns) => {
            if (err) {
                console.error('Error fetching returns:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch returns',
                    error: err.message
                });
            }

            res.json({
                success: true,
                data: returns,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        });
    });
};

/**
 * GET RETURN TIMELINE - Shows all timeline entries for a return
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
    const returnSql = `
        SELECT * FROM returns_main WHERE id = ?
    `;

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
 * CLEAR ALL RETURN DATA - For cleanup/testing
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

module.exports = exports;