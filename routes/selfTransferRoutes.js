const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

/**
 * SELF TRANSFER ROUTES
 * Handle inventory transfers between warehouses and stores
 * Uses existing self_transfer and self_transfer_items tables
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

// POST /api/self-transfer - Create new transfer with proper isolation
router.post('/', authenticateToken, (req, res) => {
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
        const transferRef = `TRF_${Date.now()}`;
        
        // Build transfer type string
        const transferTypeMap = {
            'warehouse_warehouse': 'W to W',
            'warehouse_store': 'W to S',
            'store_warehouse': 'S to W',
            'store_store': 'S to S'
        };
        
        const transferType = transferTypeMap[`${sourceType}_${destinationType}`] || 'W to W';

        // CRITICAL: Determine if this affects store systems
        const isStoreBased = destinationType === 'store' || sourceType === 'store';
        const isWarehouseToWarehouse = sourceType === 'warehouse' && destinationType === 'warehouse';

        console.log(`🔄 Processing ${transferType} transfer: ${sourceId} → ${destinationId}`);
        console.log(`📊 Store-based: ${isStoreBased}, W to W: ${isWarehouseToWarehouse}`);

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
                            transferType: transferType,
                            affectsStoreSystem: false
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

                        // CRITICAL LOGIC: Only process store systems for store-based transfers
                        if (isStoreBased && !isWarehouseToWarehouse) {
                            console.log(`📋 Processing store documentation for ${transferType} transfer`);
                            processStoreDocumentation(transferRef, transferType, sourceType, destinationType, sourceId, destinationId, item, productName, barcode);
                        } else {
                            console.log(`🏭 W to W transfer - skipping store system updates`);
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
                                    affectsStoreSystem: isStoreBased && !isWarehouseToWarehouse,
                                    documentation: {
                                        transfer_record: true,
                                        items_recorded: itemsInserted,
                                        store_inventory_updated: isStoreBased && !isWarehouseToWarehouse,
                                        billing_created: isStoreBased && !isWarehouseToWarehouse,
                                        timeline_created: isStoreBased && !isWarehouseToWarehouse
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });

        // Helper function to process store documentation
        function processStoreDocumentation(transferRef, transferType, sourceType, destinationType, sourceId, destinationId, item, productName, barcode) {
            // 1. STORE INVENTORY MANAGEMENT
            if (destinationType === 'store') {
                updateDestinationStoreInventory(barcode, productName, item.transferQty);
            }
            
            if (sourceType === 'store') {
                updateSourceStoreInventory(barcode, item.transferQty);
            }

            // 2. TIMELINE DOCUMENTATION (for all locations)
            createTimelineEntries(transferRef, transferType, sourceType, destinationType, sourceId, destinationId, barcode, productName, item.transferQty);

            // 3. STORE BILLING DOCUMENTATION
            createStoreBillingDocumentation(transferRef, transferType, sourceId, destinationId, items);
        }

        function updateDestinationStoreInventory(barcode, productName, quantity) {
            const checkProductSql = `SELECT id, stock, price FROM store_inventory WHERE barcode = ?`;
            db.query(checkProductSql, [barcode], (err, existingProduct) => {
                if (err) {
                    console.error('Error checking product existence:', err);
                    return;
                }

                if (existingProduct.length > 0) {
                    // Product exists - UPDATE ONLY STOCK
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
                    // Product doesn't exist - CREATE NEW RECORD with complete details
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
                
                // CREATE complete store inventory record
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
                    location_code, qty, direction, reference
                ) VALUES (NOW(), 'SELF_TRANSFER', ?, ?, ?, ?, ?, ?)
            `;
            
            // Create timeline entries for ALL locations (warehouse and store)
            // IN entry for destination (warehouse or store)
            db.query(timelineSql, [
                barcode, productName, destinationId, 
                quantity, 'IN', transferRef
            ], (err) => {
                if (err) console.error('Error creating destination timeline entry:', err);
                else console.log(`✅ Created timeline IN entry for ${destinationType} ${destinationId}`);
            });
            
            // OUT entry for source (warehouse or store)
            db.query(timelineSql, [
                barcode, productName, sourceId, 
                quantity, 'OUT', transferRef
            ], (err) => {
                if (err) console.error('Error creating source timeline entry:', err);
                else console.log(`✅ Created timeline OUT entry for ${sourceType} ${sourceId}`);
            });
        }

        function createStoreBillingDocumentation(transferRef, transferType, sourceId, destinationId, items) {
            // Create internal operation documentation using B2B bill type
            const billingSql = `
                INSERT INTO bills (
                    invoice_number, 
                    bill_type, 
                    customer_name, 
                    customer_phone,
                    subtotal, 
                    grand_total, 
                    payment_mode, 
                    payment_status,
                    items, 
                    total_items, 
                    created_at
                ) VALUES (?, 'B2B', ?, 'INTERNAL-OP', 0.00, 0.00, 'internal_transfer', 'completed', ?, ?, NOW())
            `;
            
            // Create proper internal operation documentation
            const getLocationDisplayName = (locationCode, locationType) => {
                const locationMap = {
                    'BLR_WH': 'Bangalore Warehouse',
                    'GGM_WH': 'Gurgaon Warehouse',
                    'DEL_WH': 'Delhi Warehouse',
                    'MUM_WH': 'Mumbai Warehouse',
                    'STORE_001': 'Main Store Delhi',
                    'STORE_002': 'Store Mumbai',
                    'STORE_003': 'Store Bangalore'
                };
                
                return locationMap[locationCode] || `${locationType.toUpperCase()} ${locationCode}`;
            };
            
            // Internal operation name (not customer name)
            const operationName = `Internal ${transferType}: ${getLocationDisplayName(sourceId, sourceType)} → ${getLocationDisplayName(destinationId, destinationType)}`;
            
            // Create detailed internal operation items
            const operationItems = items.map(item => {
                const productParts = item.productId.split('|');
                const productName = productParts[0]?.trim() || item.productId;
                const barcode = productParts[2]?.trim() || item.productId;
                
                return {
                    product_name: productName,
                    barcode: barcode,
                    quantity: item.transferQty,
                    unit_price: 0.00,  // No monetary value for internal transfers
                    total: 0.00,
                    operation_details: {
                        type: transferType,
                        source: sourceId,
                        destination: destinationId,
                        reference: transferRef,
                        timestamp: new Date().toISOString()
                    }
                };
            });
            
            db.query(billingSql, [
                transferRef,
                operationName,
                JSON.stringify(operationItems),
                items.length
            ], (err) => {
                if (err) console.error('Error creating internal operation documentation:', err);
                else console.log(`✅ Created internal operation documentation: ${transferRef}`);
            });
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
            
            // Handle items array - filter out null values and ensure it's an array
            if (transfer.items) {
                if (typeof transfer.items === 'string') {
                    try {
                        transfer.items = JSON.parse(transfer.items);
                    } catch (e) {
                        console.error('Error parsing items JSON:', e);
                        transfer.items = [];
                    }
                }
                
                // Filter out null values from JSON_ARRAYAGG
                if (Array.isArray(transfer.items)) {
                    transfer.items = transfer.items.filter(item => item !== null);
                } else {
                    transfer.items = [];
                }
            } else {
                transfer.items = [];
            }

            // Add location display names
            const locationMap = {
                'BLR_WH': 'Bangalore Warehouse',
                'GGM_WH': 'Gurgaon Warehouse', 
                'DEL_WH': 'Delhi Warehouse',
                'MUM_WH': 'Mumbai Warehouse',
                'STORE_001': 'Main Store Delhi',
                'STORE_002': 'Store Mumbai',
                'STORE_003': 'Store Bangalore'
            };

            transfer.source_display = locationMap[transfer.source_location] || transfer.source_location;
            transfer.destination_display = locationMap[transfer.destination_location] || transfer.destination_location;

            res.json({
                success: true,
                data: {
                    transfer: transfer
                }
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

// PUT /api/self-transfer/:id - Update transfer status
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updateSql = `
            UPDATE self_transfer
            SET status = ?
            WHERE transfer_reference = ?
        `;

        db.query(updateSql, [status, id], (err, result) => {
            if (err) {
                console.error('Error updating transfer:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update transfer',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Transfer updated successfully'
            });
        });
    } catch (error) {
        console.error('Transfer update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
