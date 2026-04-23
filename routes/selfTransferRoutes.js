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
                INSERT INTO self_transfer_items (transfer_reference, product_id, quantity, created_at)
                VALUES (?, ?, ?, NOW())
            `;

            let itemsInserted = 0;
            
            if (items.length === 0) {
                return res.json({
                    success: true,
                    message: 'Transfer created successfully',
                    transferId: transferRef
                });
            }

            items.forEach(item => {
                db.query(itemInsertSql, [transferRef, item.productId, item.transferQty], (err) => {
                    if (err) console.error('Error inserting item:', err);
                    itemsInserted++;

                    // After all items inserted, send response
                    if (itemsInserted === items.length) {
                        res.json({
                            success: true,
                            message: 'Transfer created successfully',
                            transferId: transferRef
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
