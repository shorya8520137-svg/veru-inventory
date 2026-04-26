const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const BillingIntegrationService = require('../services/BillingIntegrationService');

/**
 * SELF TRANSFER ROUTES (UPDATED WITH BILLING INTEGRATION)
 * Handle inventory transfers between warehouses and stores
 * Store-to-store transfers now use BillingIntegrationService for proper stock reduction
 */

// GET /api/self-transfer - Get all transfers
router.get('/', authenticateToken, (req, res) => {
    try {
        const sql = `
            SELECT 
                id,
                transfer_reference,
                order_ref,
                transfer_type,
                source_location,
                destination_location,
                awb_number,
                logistics,
                payment_mode,
                executive,
                invoice_amount,
                remarks,
                status,
                created_at
            FROM self_transfer
            ORDER BY created_at DESC
            LIMIT 100
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching transfers:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch transfers',
                    error: err.message
                });
            }

            res.json({
                success: true,
                transfers: results
            });
        });
    } catch (error) {
        console.error('Transfer API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// POST /api/self-transfer - Create new transfer with billing integration for stores
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            sourceType,
            sourceId,
            destinationType,
            destinationId,
            items,
            notes
        } = req.body;

        // Validate
        if (!sourceType || !sourceId || !destinationType || !destinationId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (sourceId === destinationId) {
            return res.status(400).json({
                success: false,
                message: 'Source and destination cannot be the same'
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one item is required'
            });
        }

        // Generate transfer reference
        const transferRef = `STF-${Date.now()}`;
        
        // Build transfer type string
        const transferTypeMap = {
            'warehouse_warehouse': 'W to W',
            'warehouse_store': 'W to S',
            'store_warehouse': 'S to W',
            'store_store': 'S to S'
        };
        
        const transferType = transferTypeMap[`${sourceType}_${destinationType}`] || 'W to W';

        // CRITICAL: Determine if this is a store-to-store transfer
        const isStoreToStore = sourceType === 'store' && destinationType === 'store';

        console.log(`🔄 Processing ${transferType} transfer: ${sourceId} → ${destinationId}`);
        console.log(`📊 Store-to-Store: ${isStoreToStore}`);

        // STORE-TO-STORE TRANSFERS: Use BillingIntegrationService
        if (isStoreToStore) {
            try {
                console.log(`💼 Using BillingIntegrationService for store-to-store transfer`);
                
                // Process items through BillingIntegrationService
                const transferResults = [];
                
                for (const item of items) {
                    // Extract product details
                    const productParts = item.productId.split('|');
                    const productName = productParts[0]?.trim() || item.productId;
                    const barcode = productParts[2]?.trim() || item.productId;
                    
                    // Create transfer with billing
                    const result = await BillingIntegrationService.createTransferWithBilling({
                        sourceStoreCode: sourceId,
                        destinationStoreCode: destinationId,
                        productBarcode: barcode,
                        productName: productName,
                        quantity: item.transferQty,
                        userId: req.user?.email || 'system',
                        transferReference: `${transferRef}-${barcode}`
                    });
                    
                    transferResults.push(result);
                }
                
                // Create transfer record in self_transfer table
                const insertSql = `
                    INSERT INTO self_transfer (
                        transfer_reference, transfer_type, source_location, destination_location,
                        remarks, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
                `;
                
                db.query(insertSql, [
                    transferRef,
                    transferType,
                    sourceId,
                    destinationId,
                    notes || '',
                    'Completed'
                ], (err, result) => {
                    if (err) {
                        console.error('Error creating transfer record:', err);
                        // Transfer already completed, just log the error
                    }
                    
                    const transferId = result?.insertId;
                    
                    // Insert transfer items
                    const itemInsertSql = `
                        INSERT INTO self_transfer_items (transfer_id, product_name, barcode, qty)
                        VALUES (?, ?, ?, ?)
                    `;
                    
                    items.forEach(item => {
                        const productParts = item.productId.split('|');
                        const productName = productParts[0]?.trim() || item.productId;
                        const barcode = productParts[2]?.trim() || item.productId;
                        
                        db.query(itemInsertSql, [transferId, productName, barcode, item.transferQty], (err) => {
                            if (err) console.error('Error inserting item:', err);
                        });
                    });
                });
                
                // Return success response
                return res.json({
                    success: true,
                    message: `Store-to-store transfer completed successfully with billing integration`,
                    transferId: transferRef,
                    transferType: transferType,
                    billingIntegration: true,
                    transferResults: transferResults.map(r => ({
                        reference: r.transferReference,
                        billingEntryId: r.billingEntryId,
                        sourceStock: r.sourceStock,
                        destinationStock: r.destinationStock
                    }))
                });
                
            } catch (error) {
                console.error('❌ Store-to-store transfer failed:', error);
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Transfer failed',
                    error: error.message
                });
            }
        }

        // NON-STORE TRANSFERS: Use existing logic (warehouse-to-warehouse, warehouse-to-store, store-to-warehouse)
        console.log(`🏭 Using legacy transfer logic for ${transferType}`);
        
        // Start database transaction for data consistency
        db.beginTransaction((err) => {
            if (err) {
                console.error('Transaction start error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to start transaction',
                    error: err.message
                });
            }

            // Create transfer record in self_transfer table
            const insertSql = `
                INSERT INTO self_transfer (
                    transfer_reference, transfer_type, source_location, destination_location,
                    remarks, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;

            db.query(insertSql, [
                transferRef, 
                transferType, 
                sourceId, 
                destinationId,
                notes || '',
                'Completed'
            ], (err, result) => {
                if (err) {
                    console.error('Error creating transfer:', err);
                    return db.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: 'Failed to create transfer',
                            error: err.message
                        });
                    });
                }

                const transferId = result.insertId;

                // Insert transfer items into self_transfer_items
                const itemInsertSql = `
                    INSERT INTO self_transfer_items (transfer_id, product_name, barcode, qty)
                    VALUES (?, ?, ?, ?)
                `;

                let itemsInserted = 0;
                let hasErrors = false;
                
                if (items.length === 0) {
                    return db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    success: false,
                                    message: 'Transaction commit failed'
                                });
                            });
                        }
                        res.json({
                            success: true,
                            message: 'Transfer created successfully',
                            transferId: transferRef,
                            transferType: transferType
                        });
                    });
                }

                items.forEach(item => {
                    // Extract product name and barcode from productId
                    const productParts = item.productId.split('|');
                    const productName = productParts[0]?.trim() || item.productId;
                    const barcode = productParts[2]?.trim() || item.productId;
                    
                    db.query(itemInsertSql, [transferId, productName, barcode, item.transferQty], (err) => {
                        if (err) {
                            console.error('Error inserting item:', err);
                            hasErrors = true;
                            return;
                        }
                        itemsInserted++;

                        // Create timeline entries for warehouse transfers
                        if (sourceType === 'warehouse' || destinationType === 'warehouse') {
                            createTimelineEntries(transferRef, transferType, sourceType, destinationType, sourceId, destinationId, barcode, productName, item.transferQty);
                        }

                        // Update store inventory for warehouse-to-store or store-to-warehouse
                        if (destinationType === 'store') {
                            updateDestinationStoreInventory(barcode, productName, item.transferQty);
                        }
                        
                        if (sourceType === 'store') {
                            updateSourceStoreInventory(barcode, item.transferQty);
                        }

                        // After all items processed
                        if (itemsInserted === items.length && !hasErrors) {
                            // Commit transaction
                            db.commit((err) => {
                                if (err) {
                                    console.error('Transaction commit error:', err);
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            success: false,
                                            message: 'Transaction commit failed'
                                        });
                                    });
                                }

                                // Return comprehensive response
                                res.json({
                                    success: true,
                                    message: `${transferType} transfer completed successfully`,
                                    transferId: transferRef,
                                    transferType: transferType,
                                    billingIntegration: false
                                });
                            });
                        }
                    });
                });
            });
        });

        // Helper functions for legacy transfers
        function updateDestinationStoreInventory(barcode, productName, quantity) {
            const checkProductSql = `SELECT id, stock, price FROM store_inventory WHERE barcode = ?`;
            db.query(checkProductSql, [barcode], (err, existingProduct) => {
                if (err) {
                    console.error('Error checking product existence:', err);
                    return;
                }

                if (existingProduct.length > 0) {
                    const updateDestSql = `
                        UPDATE store_inventory 
                        SET stock = stock + ?, 
                            last_updated = NOW()
                        WHERE barcode = ?
                    `;
                    db.query(updateDestSql, [quantity, barcode], (err) => {
                        if (err) console.error('Error updating destination store inventory:', err);
                        else console.log(`✅ Updated stock for existing product ${barcode}: +${quantity}`);
                    });
                } else {
                    createNewStoreInventoryProduct(barcode, productName, quantity);
                }
            });
        }

        function createNewStoreInventoryProduct(barcode, productName, quantity) {
            const getProductSql = `
                SELECT dp.product_name, dp.category_id, pc.name as category_name,
                       sb.price, sb.gst_percentage
                FROM dispatch_product dp
                LEFT JOIN product_categories pc ON dp.category_id = pc.id
                LEFT JOIN stock_batches sb ON dp.barcode = sb.barcode
                WHERE dp.barcode = ?
                LIMIT 1
            `;
            
            db.query(getProductSql, [barcode], (err, productResult) => {
                let actualProductName = productName;
                let actualCategory = 'General';
                let actualPrice = 0.00;
                let actualGST = 18.00;
                
                if (!err && productResult.length > 0) {
                    const product = productResult[0];
                    actualProductName = product.product_name || productName;
                    actualCategory = product.category_name || 'General';
                    actualPrice = parseFloat(product.price) || 0.00;
                    actualGST = parseFloat(product.gst_percentage) || 18.00;
                }
                
                const createProductSql = `
                    INSERT INTO store_inventory (
                        product_name, barcode, category, stock, price, 
                        gst_percentage, created_at, last_updated
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;
                
                db.query(createProductSql, [
                    actualProductName, barcode, actualCategory, 
                    quantity, actualPrice, actualGST
                ], (err) => {
                    if (err) console.error('Error creating product in store inventory:', err);
                    else console.log(`✅ Created new product in store inventory: ${actualProductName} (${barcode}) - Stock: ${quantity}`);
                });
            });
        }

        function updateSourceStoreInventory(barcode, quantity) {
            const updateSourceSql = `
                UPDATE store_inventory 
                SET stock = GREATEST(0, stock - ?), 
                    last_updated = NOW()
                WHERE barcode = ?
            `;
            db.query(updateSourceSql, [quantity, barcode], (err) => {
                if (err) console.error('Error updating source store inventory:', err);
                else console.log(`✅ Reduced stock from source store: -${quantity}`);
            });
        }

        function createTimelineEntries(transferRef, transferType, sourceType, destinationType, sourceId, destinationId, barcode, productName, quantity) {
            const timelineSql = `
                INSERT INTO inventory_ledger_base (
                    event_time, movement_type, barcode, product_name, 
                    location_code, qty, direction, reference, tenant_id
                ) VALUES (NOW(), 'SELF_TRANSFER', ?, ?, ?, ?, ?, ?, 1)
            `;
            
            if (sourceType === 'warehouse') {
                db.query(timelineSql, [
                    barcode, productName, sourceId, 
                    quantity, 'OUT', transferRef
                ], (err) => {
                    if (err) console.error('❌ Error creating source timeline entry:', err);
                    else {
                        console.log(`✅ Created timeline OUT entry for warehouse ${sourceId}`);
                        updateWarehouseStock(sourceId, barcode, -quantity, 'OUT');
                    }
                });
            }
            
            if (destinationType === 'warehouse') {
                db.query(timelineSql, [
                    barcode, productName, destinationId, 
                    quantity, 'IN', transferRef
                ], (err) => {
                    if (err) console.error('❌ Error creating destination timeline entry:', err);
                    else {
                        console.log(`✅ Created timeline IN entry for warehouse ${destinationId}`);
                        updateWarehouseStock(destinationId, barcode, quantity, 'IN');
                    }
                });
            }
        }

        function updateWarehouseStock(warehouseCode, barcode, quantityChange, direction) {
            if (direction === 'OUT') {
                const reduceStockSql = `
                    UPDATE stock_batches 
                    SET qty_available = GREATEST(0, qty_available - ?)
                    WHERE warehouse = ? AND barcode = ? AND status = 'active'
                `;
                
                db.query(reduceStockSql, [Math.abs(quantityChange), warehouseCode, barcode], (err, result) => {
                    if (err) console.error(`❌ Error reducing stock from ${warehouseCode}:`, err);
                    else console.log(`✅ Reduced stock from ${warehouseCode}: ${barcode} -${Math.abs(quantityChange)}`);
                });
            } else if (direction === 'IN') {
                const checkStockSql = `
                    SELECT id, qty_available FROM stock_batches 
                    WHERE warehouse = ? AND barcode = ? AND status = 'active'
                    LIMIT 1
                `;
                
                db.query(checkStockSql, [warehouseCode, barcode], (err, existing) => {
                    if (err) {
                        console.error(`❌ Error checking stock in ${warehouseCode}:`, err);
                        return;
                    }
                    
                    if (existing.length > 0) {
                        const updateStockSql = `
                            UPDATE stock_batches 
                            SET qty_available = qty_available + ?
                            WHERE id = ?
                        `;
                        
                        db.query(updateStockSql, [quantityChange, existing[0].id], (err) => {
                            if (err) console.error(`❌ Error updating stock in ${warehouseCode}:`, err);
                            else console.log(`✅ Updated stock in ${warehouseCode}: ${barcode} +${quantityChange}`);
                        });
                    } else {
                        const createBatchSql = `
                            INSERT INTO stock_batches (
                                barcode, product_name, warehouse, 
                                qty_initial, qty_available,
                                source_type, price, gst_percentage, status, created_at
                            ) VALUES (?, ?, ?, ?, ?, 'SELF_TRANSFER', 0.00, 18.00, 'active', NOW())
                        `;
                        
                        const getProductSql = `SELECT product_name FROM dispatch_product WHERE barcode = ? LIMIT 1`;
                        db.query(getProductSql, [barcode], (err, productResult) => {
                            const productName = (productResult && productResult.length > 0) 
                                ? productResult[0].product_name 
                                : `Product ${barcode}`;
                            
                            db.query(createBatchSql, [barcode, productName, warehouseCode, quantityChange, quantityChange], (err) => {
                                if (err) console.error(`❌ Error creating new batch in ${warehouseCode}:`, err);
                                else console.log(`✅ Created new batch in ${warehouseCode}: ${productName} (${barcode})`);
                            });
                        });
                    }
                });
            }
        }

    } catch (error) {
        console.error('Transfer creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/self-transfer/:id - Get transfer details
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT 
                t.*,
                JSON_ARRAYAGG(
                    CASE 
                        WHEN sti.id IS NOT NULL THEN
                            JSON_OBJECT(
                                'product_name', sti.product_name,
                                'barcode', sti.barcode,
                                'quantity', sti.qty
                            )
                        ELSE NULL
                    END
                ) as items
            FROM self_transfer t
            LEFT JOIN self_transfer_items sti ON t.id = sti.transfer_id
            WHERE t.transfer_reference = ?
            GROUP BY t.id
        `;

        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('Error fetching transfer:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch transfer',
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Transfer not found'
                });
            }

            const transfer = results[0];
            
            // Handle items array
            if (transfer.items) {
                if (typeof transfer.items === 'string') {
                    try {
                        transfer.items = JSON.parse(transfer.items);
                    } catch (e) {
                        transfer.items = [];
                    }
                }
                
                if (Array.isArray(transfer.items)) {
                    transfer.items = transfer.items.filter(item => item !== null);
                } else {
                    transfer.items = [];
                }
            } else {
                transfer.items = [];
            }

            res.json({
                success: true,
                transfer
            });
        });
    } catch (error) {
        console.error('Transfer fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
