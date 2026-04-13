const db = require('../db/connection');

/**
 * =====================================================
 * ORDER TRACKING CONTROLLER (Updated for Real Data)
 * Uses warehouse_dispatch, damage_recovery_log, returns_log
 * =====================================================
 */

/**
 * GET DISPATCH TIMELINE
 * Get complete timeline for a specific dispatch/order
 */
exports.getDispatchTimeline = (req, res) => {
    const { dispatchId } = req.params;
    const { limit = 50 } = req.query;

    console.log('📊 Dispatch timeline request for:', dispatchId);

    if (!dispatchId) {
        return res.status(400).json({
            success: false,
            message: 'Dispatch ID is required'
        });
    }

    // Get dispatch details first
    const dispatchSql = `
        SELECT 
            wd.*,
            wdi.id as item_id,
            wdi.product_name as item_product_name,
            wdi.variant as item_variant,
            wdi.barcode as item_barcode,
            wdi.qty as item_qty,
            wdi.selling_price
        FROM warehouse_dispatch wd
        LEFT JOIN warehouse_dispatch_items wdi ON wd.id = wdi.dispatch_id
        WHERE wd.id = ? OR wd.order_ref = ? OR wd.awb = ?
    `;

    db.query(dispatchSql, [dispatchId, dispatchId, dispatchId], (err, dispatchData) => {
        if (err) {
            console.error('❌ Dispatch query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (dispatchData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dispatch not found'
            });
        }

        const dispatch = dispatchData[0];
        const items = dispatchData.filter(item => item.item_id).map(item => ({
            id: item.item_id,
            product_name: item.item_product_name,
            variant: item.item_variant,
            barcode: item.item_barcode,
            qty: item.item_qty,
            selling_price: item.selling_price
        }));

        // Get timeline from multiple sources
        const timelineSql = `
            SELECT 
                'dispatch' as source,
                id,
                timestamp,
                'DISPATCH' as type,
                product_name,
                barcode,
                warehouse,
                qty as quantity,
                'OUT' as direction,
                CONCAT('DISPATCH_', id, '_', awb) as reference,
                CONCAT('Dispatched ', qty, ' units via ', logistics) as description,
                status,
                awb,
                logistics,
                payment_mode,
                invoice_amount
            FROM warehouse_dispatch 
            WHERE id = ? OR order_ref = ? OR awb = ?
            
            UNION ALL
            
            SELECT 
                'damage_recovery' as source,
                id,
                timestamp,
                UPPER(action_type) as type,
                product_type as product_name,
                barcode,
                inventory_location as warehouse,
                quantity,
                CASE 
                    WHEN action_type = 'damage' THEN 'OUT'
                    WHEN action_type = 'recover' THEN 'IN'
                    ELSE 'IN'
                END as direction,
                CONCAT(action_type, '#', id) as reference,
                CASE 
                    WHEN action_type = 'damage' THEN CONCAT('Reported ', quantity, ' units as damaged')
                    WHEN action_type = 'recover' THEN CONCAT('Recovered ', quantity, ' units from damage')
                    ELSE CONCAT(action_type, ': ', quantity, ' units')
                END as description,
                NULL as status,
                NULL as awb,
                NULL as logistics,
                NULL as payment_mode,
                NULL as invoice_amount
            FROM damage_recovery_log 
            WHERE barcode = ?
            
            UNION ALL
            
            SELECT 
                'self_transfer' as source,
                id,
                event_time as timestamp,
                'SELF_TRANSFER' as type,
                product_name,
                barcode,
                location_code as warehouse,
                qty as quantity,
                direction,
                reference,
                CASE 
                    WHEN direction = 'OUT' THEN CONCAT('Self Transfer OUT: ', qty, ' units from ', location_code)
                    WHEN direction = 'IN' THEN CONCAT('Self Transfer IN: ', qty, ' units to ', location_code)
                    ELSE CONCAT('Self Transfer: ', qty, ' units (', direction, ')')
                END as description,
                NULL as status,
                NULL as awb,
                NULL as logistics,
                NULL as payment_mode,
                NULL as invoice_amount
            FROM inventory_ledger_base 
            WHERE barcode = ? AND movement_type = 'SELF_TRANSFER'
            
            UNION ALL
            
            SELECT 
                'inventory_ledger' as source,
                id,
                event_time as timestamp,
                movement_type as type,
                product_name,
                barcode,
                location_code as warehouse,
                qty as quantity,
                direction,
                reference,
                CONCAT(movement_type, ': ', qty, ' units (', direction, ')') as description,
                NULL as status,
                NULL as awb,
                NULL as logistics,
                NULL as payment_mode,
                NULL as invoice_amount
            FROM inventory_ledger_base 
            WHERE barcode = ? AND reference LIKE CONCAT('%', ?, '%')
            
            ORDER BY timestamp DESC
            LIMIT ?
        `;

        db.query(timelineSql, [
            dispatchId, dispatchId, dispatchId, // dispatch queries
            dispatch.barcode, // damage_recovery query
            dispatch.barcode, // self_transfer query
            dispatch.barcode, dispatchId, // inventory_ledger query
            parseInt(limit)
        ], (err, timeline) => {
            if (err) {
                console.error('❌ Timeline query error:', err);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            // Get current stock for the product
            const stockSql = `
                SELECT 
                    SUM(qty_available) as current_stock
                FROM stock_batches 
                WHERE barcode = ? AND status = 'active'
            `;

            db.query(stockSql, [dispatch.barcode], (err, stockData) => {
                if (err) {
                    console.error('❌ Stock query error:', err);
                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                const currentStock = stockData[0]?.current_stock || 0;

                // Calculate summary
                const summary = {
                    total_movements: timeline.length,
                    dispatched: timeline.filter(t => t.type === 'DISPATCH').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    damaged: timeline.filter(t => t.type === 'DAMAGE').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    recovered: timeline.filter(t => t.type === 'RECOVER').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    self_transfer_in: timeline.filter(t => t.type === 'SELF_TRANSFER' && t.direction === 'IN').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    self_transfer_out: timeline.filter(t => t.type === 'SELF_TRANSFER' && t.direction === 'OUT').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    current_stock: currentStock
                };

                res.json({
                    success: true,
                    data: {
                        dispatch: {
                            id: dispatch.id,
                            status: dispatch.status,
                            warehouse: dispatch.warehouse,
                            order_ref: dispatch.order_ref,
                            customer: dispatch.customer,
                            product_name: dispatch.product_name,
                            barcode: dispatch.barcode,
                            qty: dispatch.qty,
                            awb: dispatch.awb,
                            logistics: dispatch.logistics,
                            payment_mode: dispatch.payment_mode,
                            invoice_amount: dispatch.invoice_amount,
                            timestamp: dispatch.timestamp,
                            items: items
                        },
                        timeline: timeline.map(item => ({
                            ...item,
                            quantity: parseInt(item.quantity),
                            timestamp: item.timestamp
                        })),
                        summary
                    }
                });
            });
        });
    });
};

/**
 * GET ALL DISPATCHES WITH TRACKING INFO
 * Get all dispatches with damage/recovery counts + self transfers
 * FIXED: Prevent duplication by using DISTINCT and better filtering
 */
exports.getAllDispatches = (req, res) => {
    const { 
        warehouse, 
        status, 
        dateFrom, 
        dateTo
    } = req.query;

    const filters = [];
    const values = [];

    // Warehouse permission filtering
    const userPermissions = req.user?.permissions || [];
    const hasGlobalOrdersView = userPermissions.includes('ORDERS_VIEW') || userPermissions.includes('SYSTEM_USER_MANAGEMENT');
    
    if (!hasGlobalOrdersView) {
        // User doesn't have global orders view, check warehouse-specific permissions
        const accessibleWarehouses = [];
        const warehouseCodes = ['GGM_WH', 'BLR_WH', 'MUM_WH', 'AMD_WH', 'HYD_WH'];
        
        warehouseCodes.forEach(whCode => {
            if (userPermissions.includes(`ORDERS_VIEW_${whCode}`)) {
                accessibleWarehouses.push(whCode);
            }
        });
        
        if (accessibleWarehouses.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'No warehouse access permissions for orders'
            });
        }
        
        // Filter by accessible warehouses
        filters.push(`wd.warehouse IN (${accessibleWarehouses.map(() => '?').join(',')})`);
        values.push(...accessibleWarehouses);
        console.log('🔐 User has access to warehouses for orders:', accessibleWarehouses);
    }

    if (warehouse) {
        // Check if user has permission for this specific warehouse
        if (!hasGlobalOrdersView && !userPermissions.includes(`ORDERS_VIEW_${warehouse}`)) {
            return res.status(403).json({
                success: false,
                message: `No access to orders for warehouse: ${warehouse}`
            });
        }
        
        filters.push('wd.warehouse = ?');
        values.push(warehouse);
    }

    if (status) {
        filters.push('wd.status = ?');
        values.push(status);
    }

    if (dateFrom) {
        filters.push('wd.timestamp >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('wd.timestamp <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    // FIXED: Clean query to get only dispatch records without duplicates
    const sql = `
        SELECT DISTINCT
            'dispatch' as source_type,
            wd.id,
            wd.timestamp,
            wd.warehouse,
            wd.order_ref,
            wd.customer,
            COALESCE(wdi.product_name, wd.product_name) as product_name,
            COALESCE(wdi.barcode, wd.barcode) as barcode,
            COALESCE(wdi.qty, wd.qty) as qty,
            COALESCE(wdi.variant, wd.variant) as variant,
            COALESCE(wdi.selling_price, 0) as selling_price,
            wd.awb,
            wd.logistics,
            wd.parcel_type,
            wd.length,
            wd.width,
            wd.height,
            wd.actual_weight,
            wd.payment_mode,
            wd.invoice_amount,
            wd.processed_by,
            wd.remarks,
            wd.status,
            0 as damage_count,
            0 as recovery_count,
            0 as current_stock,
            wdi.id as item_id
        FROM warehouse_dispatch wd
        LEFT JOIN warehouse_dispatch_items wdi ON wd.id = wdi.dispatch_id
        ${whereClause}
        ORDER BY wd.timestamp DESC, wd.id, wdi.id
    `;

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('❌ Dispatches query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        console.log(`✅ Retrieved ${results.length} dispatch records`);
        
        // Log summary for debugging
        const orderGroups = {};
        results.forEach(record => {
            const orderRef = record.order_ref || 'NO_REF';
            if (!orderGroups[orderRef]) {
                orderGroups[orderRef] = [];
            }
            orderGroups[orderRef].push(record.product_name);
        });
        
        console.log('📊 Order summary:');
        Object.keys(orderGroups).forEach(orderRef => {
            console.log(`   ${orderRef}: ${orderGroups[orderRef].length} products`);
        });

        res.json({
            success: true,
            data: results,
            total: results.length,
            message: `Retrieved ${results.length} records`
        });
    });
};

/**
 * REPORT DISPATCH DAMAGE
 * Report damage for dispatched items
 */
exports.reportDispatchDamage = (req, res) => {
    const { dispatchId } = req.params;
    const {
        product_name,
        barcode,
        warehouse,
        quantity = 1,
        reason,
        notes
    } = req.body;

    if (!product_name || !barcode || !warehouse) {
        return res.status(400).json({
            success: false,
            message: 'product_name, barcode, warehouse are required'
        });
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
        return res.status(400).json({
            success: false,
            message: 'quantity must be greater than 0'
        });
    }

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        // Insert into damage_recovery_log
        const damageSql = `
            INSERT INTO damage_recovery_log (
                product_type, barcode, inventory_location, action_type, quantity
            ) VALUES (?, ?, ?, 'damage', ?)
        `;

        db.query(damageSql, [product_name, barcode, warehouse, qty], (err, result) => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            const damageId = result.insertId;

            // Update stock_batches (FIFO)
            const getBatchesSql = `
                SELECT id, qty_available 
                FROM stock_batches 
                WHERE barcode = ? AND warehouse = ? AND status = 'active' AND qty_available > 0
                ORDER BY created_at ASC
            `;

            db.query(getBatchesSql, [barcode, warehouse], (err, batches) => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, error: err.message })
                    );
                }

                if (batches.length === 0) {
                    return db.rollback(() =>
                        res.status(400).json({
                            success: false,
                            message: 'No active stock batches found'
                        })
                    );
                }

                let remainingQty = qty;
                let updateCount = 0;

                batches.forEach(batch => {
                    if (remainingQty <= 0) {
                        updateCount++;
                        if (updateCount === batches.length) commitTransaction();
                        return;
                    }

                    const deductQty = Math.min(batch.qty_available, remainingQty);
                    const newQty = batch.qty_available - deductQty;
                    const newStatus = newQty === 0 ? 'exhausted' : 'active';

                    const updateBatchSql = `
                        UPDATE stock_batches 
                        SET qty_available = ?, status = ? 
                        WHERE id = ?
                    `;

                    db.query(updateBatchSql, [newQty, newStatus, batch.id], (err) => {
                        if (err) {
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }

                        remainingQty -= deductQty;
                        updateCount++;

                        if (updateCount === batches.length) {
                            commitTransaction();
                        }
                    });
                });

                function commitTransaction() {
                    // Add to inventory ledger
                    const ledgerSql = `
                        INSERT INTO inventory_ledger_base (
                            event_time, movement_type, barcode, product_name,
                            location_code, qty, direction, reference
                        ) VALUES (NOW(), 'DISPATCH_DAMAGE', ?, ?, ?, ?, 'OUT', ?)
                    `;

                    db.query(ledgerSql, [barcode, product_name, warehouse, qty, `dispatch_damage#${damageId}`], (err) => {
                        if (err) {
                            console.log('⚠️ Ledger insert failed:', err);
                        }

                        db.commit(err => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, message: err.message })
                                );
                            }

                            res.status(201).json({
                                success: true,
                                message: 'Dispatch damage reported successfully',
                                damage_id: damageId,
                                dispatch_id: dispatchId,
                                quantity: qty,
                                reference: `dispatch_damage#${damageId}`
                            });
                        });
                    });
                }
            });
        });
    });
};

/**
 * GET DISPATCH SUMMARY STATS
 */
exports.getDispatchStats = (req, res) => {
    const { warehouse, dateFrom, dateTo } = req.query;

    const filters = [];
    const values = [];

    if (warehouse) {
        filters.push('warehouse = ?');
        values.push(warehouse);
    }

    if (dateFrom) {
        filters.push('timestamp >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('timestamp <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const sql = `
        SELECT 
            COUNT(*) as total_dispatches,
            SUM(qty) as total_quantity,
            SUM(invoice_amount) as total_amount,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN status = 'Dispatched' THEN 1 END) as dispatched_count,
            COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as delivered_count,
            warehouse
        FROM warehouse_dispatch 
        ${whereClause}
        GROUP BY warehouse
        ORDER BY total_dispatches DESC
    `;

    db.query(sql, values, (err, stats) => {
        if (err) {
            console.error('❌ Stats query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: stats
        });
    });
};

/**
 * DELETE DISPATCH WITH STOCK RESTORATION
 * Deletes a dispatch and restores stock quantities to stock_batches
 */
exports.deleteDispatch = (req, res) => {
    const { dispatchId } = req.params;

    console.log('🗑️ Delete dispatch request for:', dispatchId);

    if (!dispatchId) {
        return res.status(400).json({
            success: false,
            message: 'Dispatch ID is required'
        });
    }

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        // First, get dispatch details
        const getDispatchSql = `
            SELECT * FROM warehouse_dispatch 
            WHERE id = ?
        `;

        db.query(getDispatchSql, [dispatchId], (err, dispatchData) => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            if (dispatchData.length === 0) {
                return db.rollback(() =>
                    res.status(404).json({ success: false, message: 'Dispatch not found' })
                );
            }

            const dispatch = dispatchData[0];
            const { warehouse } = dispatch;

            // Check if dispatch has items in warehouse_dispatch_items
            const getItemsSql = `SELECT * FROM warehouse_dispatch_items WHERE dispatch_id = ?`;

            db.query(getItemsSql, [dispatchId], (err, items) => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, error: err.message })
                    );
                }

                // If items exist, restore ALL products from items table
                // Otherwise, restore from main dispatch record (backward compatibility)
                const productsToRestore = items.length > 0 
                    ? items.map(item => ({
                        barcode: item.barcode,
                        product_name: item.product_name,
                        qty: item.qty
                    }))
                    : [{
                        barcode: dispatch.barcode,
                        product_name: dispatch.product_name,
                        qty: dispatch.qty
                    }];

                console.log(`🔄 Restoring stock for ${productsToRestore.length} products`);

                // Restore stock for EACH product
                let restoredCount = 0;
                const totalProducts = productsToRestore.length;

                productsToRestore.forEach(product => {
                    restoreProductStock(product, () => {
                        restoredCount++;
                        if (restoredCount === totalProducts) {
                            // All products restored, now delete dispatch
                            deleteDispatchAndItems();
                        }
                    });
                });

                function restoreProductStock(product, callback) {
                    const { barcode, product_name, qty } = product;

                    // CORRECT LOGIC: Restore stock to existing stock_batches
                    // Find the most recent batches that were affected (LIFO for restoration)
                    const getBatchesSql = `
                        SELECT id, qty_available, status
                        FROM stock_batches 
                        WHERE barcode = ? AND warehouse = ? 
                        ORDER BY created_at DESC
                        LIMIT 10
                    `;

                    db.query(getBatchesSql, [barcode, warehouse], (err, batches) => {
                        if (err) {
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }

                        if (batches.length === 0) {
                            return db.rollback(() =>
                                res.status(400).json({ 
                                    success: false, 
                                    message: `No stock batches found for product ${product_name}` 
                                })
                            );
                        }

                        // Restore stock using LIFO (Last In, First Out) - reverse of dispatch FIFO
                        let remainingQty = qty;
                        const batchUpdates = [];

                        for (const batch of batches) {
                            if (remainingQty <= 0) break;

                            // Add back the quantity to this batch
                            const restoreQty = remainingQty; // Restore all remaining to this batch
                            const newQty = batch.qty_available + restoreQty;
                            const newStatus = 'active'; // Always set to active when restoring

                            batchUpdates.push({
                                id: batch.id,
                                newQty,
                                newStatus,
                                restoreQty
                            });

                            remainingQty = 0; // All quantity restored to this batch
                        }

                        // If we couldn't restore to existing batches, create a new one
                        if (remainingQty > 0) {
                            const createBatchSql = `
                                INSERT INTO stock_batches (
                                    barcode, product_name, warehouse, qty_available, 
                                    status, created_at, batch_ref, source_type
                                ) VALUES (?, ?, ?, ?, 'active', NOW(), ?, 'DISPATCH_REVERSAL')
                            `;

                            const batchRef = `RESTORE_DISPATCH_${dispatchId}_${Date.now()}`;

                            db.query(createBatchSql, [
                                barcode, product_name, warehouse, remainingQty, batchRef
                            ], (err) => {
                                if (err) {
                                    return db.rollback(() =>
                                        res.status(500).json({ success: false, error: err.message })
                                    );
                                }

                                // Continue with existing batch updates
                                updateBatchesForProduct();
                            });
                        } else {
                            // All quantity can be restored to existing batches
                            updateBatchesForProduct();
                        }

                        function updateBatchesForProduct() {
                            if (batchUpdates.length === 0) {
                                // No batch updates needed, just add ledger
                                addLedgerForProduct();
                                return;
                            }

                            let updateCount = 0;
                            const totalUpdates = batchUpdates.length;

                            batchUpdates.forEach(update => {
                                const updateBatchSql = `
                                    UPDATE stock_batches 
                                    SET qty_available = ?, status = ? 
                                    WHERE id = ?
                                `;

                                db.query(updateBatchSql, [update.newQty, update.newStatus, update.id], (err) => {
                                    if (err) {
                                        return db.rollback(() =>
                                            res.status(500).json({ success: false, error: err.message })
                                        );
                                    }

                                    updateCount++;

                                    if (updateCount === totalUpdates) {
                                        addLedgerForProduct();
                                    }
                                });
                            });
                        }

                        function addLedgerForProduct() {
                            // Add reversal entry to inventory ledger
                            const ledgerSql = `
                                INSERT INTO inventory_ledger_base (
                                    event_time, movement_type, barcode, product_name,
                                    location_code, qty, direction, reference
                                ) VALUES (NOW(), 'DISPATCH_REVERSAL', ?, ?, ?, ?, 'IN', ?)
                            `;

                            db.query(ledgerSql, [
                                barcode, product_name, warehouse, qty, `DISPATCH_DELETE_${dispatchId}`
                            ], (err) => {
                                if (err) {
                                    console.log('⚠️ Ledger insert failed:', err);
                                    // Continue anyway - stock restoration is more important
                                }

                                callback();
                            });
                        }
                    });
                }

                function deleteDispatchAndItems() {
                    // Delete the dispatch record
                    const deleteDispatchSql = `DELETE FROM warehouse_dispatch WHERE id = ?`;

                    db.query(deleteDispatchSql, [dispatchId], (err) => {
                        if (err) {
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }

                        // Delete related dispatch items
                        const deleteItemsSql = `DELETE FROM warehouse_dispatch_items WHERE dispatch_id = ?`;

                        db.query(deleteItemsSql, [dispatchId], (err) => {
                            if (err) {
                                console.log('⚠️ Failed to delete dispatch items:', err);
                                // Continue anyway
                            }

                            db.commit(err => {
                                if (err) {
                                    return db.rollback(() =>
                                        res.status(500).json({ success: false, message: err.message })
                                    );
                                }

                                // Log ORDER_DELETE audit using PermissionsController
                                if (req.user) {
                                    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                                                     req.headers['x-real-ip'] ||
                                                     req.connection.remoteAddress ||
                                                     req.ip ||
                                                     '127.0.0.1';
                                    
                                    const PermissionsController = require('../controllers/permissionsController');
                                    PermissionsController.createAuditLog(req.user.id, 'DELETE', 'DISPATCH', dispatchId, {
                                        user_name: req.user.name || 'Unknown',
                                        user_email: req.user.email || 'Unknown',
                                        dispatch_id: dispatchId,
                                        warehouse: warehouse,
                                        restored_products: totalProducts,
                                        delete_time: new Date().toISOString(),
                                        ip_address: ipAddress,
                                        user_agent: req.get('User-Agent') || 'Unknown'
                                    });
                                }

                                res.json({
                                    success: true,
                                    message: 'Dispatch deleted successfully and stock restored',
                                    deleted_dispatch_id: dispatchId,
                                    restored_products: totalProducts,
                                    warehouse: warehouse,
                                    stock_restoration: `Stock restored for ${totalProducts} product(s)`
                                });
                            });
                        });
                    });
                }
            });
        });
    });
};

/**
 * UPDATE DISPATCH STATUS
 * Updates the status of a dispatch order OR self-transfer
 * FIXED: Properly handles multiple products with same AWB + Self-Transfer support
 */
exports.updateDispatchStatus = (req, res) => {
    const { dispatchId } = req.params;
    const { status, barcode } = req.body;

    console.log('🔄 Update dispatch status request for:', dispatchId, 'barcode:', barcode, 'to:', status);

    if (!dispatchId) {
        return res.status(400).json({
            success: false,
            message: 'Dispatch ID is required'
        });
    }

    if (!status) {
        return res.status(400).json({
            success: false,
            message: 'Status is required'
        });
    }

    // Valid status values for dispatches
    const validDispatchStatuses = [
        'Pending', 'Processing', 'Confirmed', 'Packed', 'Dispatched',
        'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'
    ];

    // Valid status values for self-transfers
    const validSelfTransferStatuses = [
        'Pending', 'Processing', 'Confirmed', 'Completed', 'Cancelled'
    ];

    // First, determine if this is a dispatch or self-transfer by checking both tables
    const checkTypeSql = `
        SELECT 'dispatch' as type, id FROM warehouse_dispatch WHERE id = ?
        UNION ALL
        SELECT 'self_transfer' as type, id FROM self_transfer WHERE id = ?
    `;

    db.query(checkTypeSql, [dispatchId, dispatchId], (err, typeResult) => {
        if (err) {
            console.error('❌ Type check error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (typeResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Record not found in dispatch or self-transfer tables'
            });
        }

        const recordType = typeResult[0].type;
        console.log(`📋 Record type detected: ${recordType}`);

        // Validate status based on record type
        const validStatuses = recordType === 'dispatch' ? validDispatchStatuses : validSelfTransferStatuses;
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status for ${recordType}. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        if (recordType === 'dispatch') {
            // Handle dispatch status update (existing logic)
            handleDispatchStatusUpdate();
        } else {
            // Handle self-transfer status update (new logic)
            handleSelfTransferStatusUpdate();
        }

        function handleDispatchStatusUpdate() {
            // CORRECTED LOGIC: warehouse_dispatch_items table doesn't have status column
            // Status is only stored in the main warehouse_dispatch table
            // For multi-product dispatches, we update the main dispatch status
            
            if (barcode) {
                // Case 1: Specific product update (when barcode is provided)
                // First verify the product exists in this dispatch
                const verifyProductSql = `
                    SELECT wd.id, wd.barcode as main_barcode, wdi.barcode as item_barcode
                    FROM warehouse_dispatch wd
                    LEFT JOIN warehouse_dispatch_items wdi ON wd.id = wdi.dispatch_id
                    WHERE wd.id = ? AND (wd.barcode = ? OR wdi.barcode = ?)
                `;
                
                db.query(verifyProductSql, [dispatchId, barcode, barcode], (err, verification) => {
                    if (err) {
                        console.error('❌ Product verification error:', err);
                        return res.status(500).json({
                            success: false,
                            error: err.message
                        });
                    }

                    if (verification.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Product not found in this dispatch'
                        });
                    }

                    // Product exists, update the main dispatch status
                    // Note: For multi-product dispatches, this updates the entire dispatch status
                    // This is the correct behavior as status applies to the entire shipment
                    const updateMainSql = `UPDATE warehouse_dispatch SET status = ? WHERE id = ?`;
                    
                    db.query(updateMainSql, [status, dispatchId], (err, result) => {
                        if (err) {
                            console.error('❌ Status update error:', err);
                            return res.status(500).json({
                                success: false,
                                error: err.message
                            });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                success: false,
                                message: 'Dispatch not found'
                            });
                        }

                        console.log('✅ Dispatch status updated successfully');

                        res.json({
                            success: true,
                            message: 'Dispatch status updated successfully',
                            dispatch_id: dispatchId,
                            barcode: barcode,
                            new_status: status,
                            type: 'dispatch',
                            note: 'Status updated for entire dispatch (affects all products in this AWB)'
                        });
                    });
                });
            } else {
                // Case 2: Update entire dispatch (when no barcode provided - backward compatibility)
                const updateSql = `UPDATE warehouse_dispatch SET status = ? WHERE id = ?`;
                
                db.query(updateSql, [status, dispatchId], (err, result) => {
                    if (err) {
                        console.error('❌ Status update error:', err);
                        return res.status(500).json({
                            success: false,
                            error: err.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Dispatch not found'
                        });
                    }

                    console.log('✅ Dispatch status updated successfully');

                    res.json({
                        success: true,
                        message: 'Dispatch status updated successfully',
                        dispatch_id: dispatchId,
                        new_status: status,
                        type: 'dispatch'
                    });
                });
            }
        }

        function handleSelfTransferStatusUpdate() {
            console.log('🔄 Handling self-transfer status update');
            
            if (barcode) {
                // Case 1: Specific product update for self-transfer
                // First verify the product exists in this self-transfer
                const verifyProductSql = `
                    SELECT st.id, sti.barcode
                    FROM self_transfer st
                    LEFT JOIN self_transfer_items sti ON st.id = sti.transfer_id
                    WHERE st.id = ? AND sti.barcode = ?
                `;
                
                db.query(verifyProductSql, [dispatchId, barcode], (err, verification) => {
                    if (err) {
                        console.error('❌ Self-transfer product verification error:', err);
                        return res.status(500).json({
                            success: false,
                            error: err.message
                        });
                    }

                    if (verification.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Product not found in this self-transfer'
                        });
                    }

                    // Product exists, update the self-transfer status
                    const updateSelfTransferSql = `UPDATE self_transfer SET status = ? WHERE id = ?`;
                    
                    db.query(updateSelfTransferSql, [status, dispatchId], (err, result) => {
                        if (err) {
                            console.error('❌ Self-transfer status update error:', err);
                            return res.status(500).json({
                                success: false,
                                error: err.message
                            });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                success: false,
                                message: 'Self-transfer not found'
                            });
                        }

                        console.log('✅ Self-transfer status updated successfully');

                        res.json({
                            success: true,
                            message: 'Self-transfer status updated successfully',
                            transfer_id: dispatchId,
                            barcode: barcode,
                            new_status: status,
                            type: 'self_transfer',
                            note: 'Status updated for entire self-transfer'
                        });
                    });
                });
            } else {
                // Case 2: Update entire self-transfer (when no barcode provided)
                const updateSql = `UPDATE self_transfer SET status = ? WHERE id = ?`;
                
                db.query(updateSql, [status, dispatchId], (err, result) => {
                    if (err) {
                        console.error('❌ Self-transfer status update error:', err);
                        return res.status(500).json({
                            success: false,
                            error: err.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Self-transfer not found'
                        });
                    }

                    console.log('✅ Self-transfer status updated successfully');

                    res.json({
                        success: true,
                        message: 'Self-transfer status updated successfully',
                        transfer_id: dispatchId,
                        new_status: status,
                        type: 'self_transfer'
                    });
                });
            }
        }
    });
};

/**
 * EXPORT DISPATCHES TO CSV
 * Export all dispatches AND self-transfers with optional filters as CSV file
 * FIXED: Now includes both dispatches and self-transfers like getAllDispatches
 */
exports.exportDispatches = (req, res) => {
    const { 
        warehouse, 
        status, 
        dateFrom, 
        dateTo
    } = req.query;

    const filters = [];
    const values = [];

    if (warehouse) {
        filters.push('warehouse = ?');
        values.push(warehouse);
    }

    if (status) {
        filters.push('status = ?');
        values.push(status);
    }

    if (dateFrom) {
        filters.push('timestamp >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('timestamp <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    // FIXED: Use the same query as getAllDispatches to include both dispatches and self-transfers
    const sql = `
        SELECT 
            'dispatch' as source_type,
            wd.id,
            wd.timestamp,
            wd.warehouse,
            wd.order_ref,
            wd.customer,
            COALESCE(wdi.product_name, wd.product_name) as product_name,
            COALESCE(wdi.barcode, wd.barcode) as barcode,
            COALESCE(wdi.qty, wd.qty) as qty,
            COALESCE(wdi.variant, wd.variant) as variant,
            COALESCE(wdi.selling_price, 0) as selling_price,
            wd.awb,
            wd.logistics,
            wd.parcel_type,
            wd.length,
            wd.width,
            wd.height,
            wd.actual_weight,
            wd.payment_mode,
            wd.invoice_amount,
            wd.processed_by,
            wd.remarks,
            wd.status
        FROM warehouse_dispatch wd
        LEFT JOIN warehouse_dispatch_items wdi ON wd.id = wdi.dispatch_id
        ${whereClause}
        
        UNION ALL
        
        SELECT 
            'self_transfer' as source_type,
            st.id,
            ilb.event_time as timestamp,
            ilb.location_code as warehouse,
            st.order_ref,
            CONCAT('Self Transfer from ', st.source_location) as customer,
            ilb.product_name,
            ilb.barcode,
            ilb.qty,
            NULL as variant,
            0 as selling_price,
            st.awb_number as awb,
            st.logistics,
            'Self Transfer' as parcel_type,
            st.length,
            st.width,
            st.height,
            st.weight as actual_weight,
            st.payment_mode,
            st.invoice_amount,
            st.executive as processed_by,
            st.remarks,
            st.status
        FROM inventory_ledger_base ilb
        INNER JOIN self_transfer st ON ilb.reference = st.transfer_reference
        WHERE ilb.movement_type = 'SELF_TRANSFER'
        AND ilb.direction = 'IN'
        ${warehouse ? 'AND ilb.location_code = ?' : ''}
        ${dateFrom ? 'AND ilb.event_time >= ?' : ''}
        ${dateTo ? 'AND ilb.event_time <= ?' : ''}
        
        ORDER BY timestamp DESC
    `;

    // Build values array for the combined query (same as getAllDispatches)
    const combinedValues = [...values]; // For warehouse_dispatch WHERE clause
    
    // Add values for self_transfer WHERE clause
    if (warehouse) combinedValues.push(warehouse);
    if (dateFrom) combinedValues.push(`${dateFrom} 00:00:00`);
    if (dateTo) combinedValues.push(`${dateTo} 23:59:59`);
    db.query(sql, combinedValues, (err, results) => {
        if (err) {
            console.error('❌ Export query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // Generate CSV with updated headers to include source_type
        const csvHeader = [
            'ID', 'Date', 'Type', 'Warehouse', 'Order Ref', 'Customer', 'Product Name', 
            'Barcode', 'Quantity', 'Variant', 'Selling Price', 'AWB', 'Logistics', 
            'Parcel Type', 'Length', 'Width', 'Height', 'Weight', 'Payment Mode', 
            'Invoice Amount', 'Processed By', 'Remarks', 'Status'
        ].join(',') + '\n';

        const csvRows = results.map(row => [
            row.id,
            row.timestamp ? new Date(row.timestamp).toISOString().split('T')[0] : '',
            `"${row.source_type || 'dispatch'}"`,
            `"${row.warehouse || ''}"`,
            `"${row.order_ref || ''}"`,
            `"${row.customer || ''}"`,
            `"${row.product_name || ''}"`,
            `"${row.barcode || ''}"`,
            row.qty || 0,
            `"${row.variant || ''}"`,
            row.selling_price || 0,
            `"${row.awb || ''}"`,
            `"${row.logistics || ''}"`,
            `"${row.parcel_type || ''}"`,
            row.length || 0,
            row.width || 0,
            row.height || 0,
            row.actual_weight || 0,
            `"${row.payment_mode || ''}"`,
            row.invoice_amount || 0,
            `"${row.processed_by || ''}"`,
            `"${row.remarks || ''}"`,
            `"${row.status || ''}"`
        ].join(',')).join('\n');

        const csv = csvHeader + csvRows;

        // Set CSV headers
        const fileName = `dispatches_and_transfers_${warehouse || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        console.log(`✅ Exported ${results.length} dispatch and self-transfer records to CSV`);
        res.send(csv);
    });
};

module.exports = exports;
