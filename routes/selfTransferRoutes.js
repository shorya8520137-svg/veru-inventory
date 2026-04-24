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

// POST /api/self-transfer - Create new transfer
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

        // Check if this is a store-based transfer (involves store)
        const isStoreBased = destinationType === 'store' || sourceType === 'store';

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
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create transfer',
                    error: err.message
                });
            }

            // Insert transfer items into self_transfer_items
            const itemInsertSql = `
                INSERT INTO self_transfer_items (transfer_id, product_name, barcode, qty)
                VALUES (?, ?, ?, ?)
            `;

            let itemsInserted = 0;
            let hasErrors = false;
            
            if (items.length === 0) {
                return res.json({
                    success: true,
                    message: 'Transfer created successfully',
                    transferId: transferRef
                });
            }

            items.forEach(item => {
                // Extract product name and barcode from productId
                const productParts = item.productId.split('|');
                const productName = productParts[0]?.trim() || item.productId;
                const barcode = productParts[2]?.trim() || item.productId;
                
                db.query(itemInsertSql, [result.insertId, productName, barcode, item.transferQty], (err) => {
                    if (err) {
                        console.error('Error inserting item:', err);
                        hasErrors = true;
                        return;
                    }
                    itemsInserted++;

                    // Only update store inventory for store-based transfers
                    if (isStoreBased) {
                        // Update store inventory when transferring to stores
                        if (destinationType === 'store') {
                            // Check if product exists in store inventory
                            const checkProductSql = `SELECT id, stock FROM store_inventory WHERE barcode = ?`;
                            db.query(checkProductSql, [barcode], (err, existingProduct) => {
                                if (err) {
                                    console.error('Error checking product existence:', err);
                                    return;
                                }

                                if (existingProduct.length > 0) {
                                    // Product exists, update stock
                                    const updateDestSql = `
                                        UPDATE store_inventory 
                                        SET stock = stock + ?, last_updated = NOW()
                                        WHERE barcode = ?
                                    `;
                                    db.query(updateDestSql, [item.transferQty, barcode], (err) => {
                                        if (err) console.error('Error updating destination store inventory:', err);
                                    });
                                } else {
                                    // Product doesn't exist, create it
                                    // Get actual product details from dispatch_product table
                                    const getProductSql = `
                                        SELECT product_name, category_id 
                                        FROM dispatch_product 
                                        WHERE barcode = ?
                                    `;
                                    
                                    db.query(getProductSql, [barcode], (err, productResult) => {
                                        let actualProductName = productName;
                                        let actualCategory = 'General';
                                        
                                        if (!err && productResult.length > 0) {
                                            actualProductName = productResult[0].product_name || productName;
                                            // Get category name if category_id exists
                                            if (productResult[0].category_id) {
                                                const getCategorySql = `SELECT name FROM product_categories WHERE id = ?`;
                                                db.query(getCategorySql, [productResult[0].category_id], (err, catResult) => {
                                                    if (!err && catResult.length > 0) {
                                                        actualCategory = catResult[0].name;
                                                    }
                                                    createStoreInventoryRecord();
                                                });
                                                return;
                                            }
                                        }
                                        createStoreInventoryRecord();
                                        
                                        function createStoreInventoryRecord() {
                                            const createProductSql = `
                                                INSERT INTO store_inventory (product_name, barcode, category, stock, price, gst_percentage, created_at, last_updated)
                                                VALUES (?, ?, ?, ?, 0.00, 18.00, NOW(), NOW())
                                            `;
                                            db.query(createProductSql, [actualProductName, barcode, actualCategory, item.transferQty], (err) => {
                                                if (err) console.error('Error creating product in store inventory:', err);
                                            });
                                        }
                                    });
                        }
                        
                        // Update store inventory when transferring from stores
                        if (sourceType === 'store') {
                            // Remove stock from source store
                            const updateSourceSql = `
                                UPDATE store_inventory 
                                SET stock = GREATEST(0, stock - ?), last_updated = NOW()
                                WHERE barcode = ?
                            `;
                            db.query(updateSourceSql, [item.transferQty, barcode], (err) => {
                                if (err) console.error('Error updating source store inventory:', err);
                            });
                        }
                    }

                    // After all items inserted, create billing history ONLY for store-based transfers
                    if (itemsInserted === items.length && !hasErrors) {
                        if (isStoreBased) {
                            // Create billing history entry only for store-based transfers
                            const billingSql = `
                                INSERT INTO bills (
                                    invoice_number, bill_type, customer_name, customer_phone,
                                    subtotal, grand_total, payment_mode, payment_status,
                                    items, total_items, created_at
                                ) VALUES (?, 'B2B', ?, 'INTERNAL', 0.00, 0.00, 'transfer', 'paid', ?, ?, NOW())
                            `;
                            
                            const billingItems = JSON.stringify(items.map(item => {
                                const productParts = item.productId.split('|');
                                const productName = productParts[0]?.trim() || item.productId;
                                const barcode = productParts[2]?.trim() || item.productId;
                                return {
                                    product_name: productName,
                                    barcode: barcode,
                                    quantity: item.transferQty,
                                    price: 0,
                                    total: 0
                                };
                            }));

                            const customerName = `Store Transfer: ${sourceId} → ${destinationId}`;
                            
                            db.query(billingSql, [transferRef, customerName, billingItems, items.length], (err) => {
                                if (err) console.error('Error creating billing history:', err);
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Transfer created successfully',
                            transferId: transferRef,
                            isStoreBased: isStoreBased,
                            billingCreated: isStoreBased
                        });
                    }
                });
            });
        });
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
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'productId', sti.product_id,
                        'quantity', sti.quantity
                    )
                ) as items
            FROM self_transfer t
            LEFT JOIN self_transfer_items sti ON t.transfer_reference = sti.transfer_reference
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

            res.json({
                success: true,
                transfer: results[0]
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
