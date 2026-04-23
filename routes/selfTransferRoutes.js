const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

/**
 * SELF TRANSFER ROUTES
 * Handle inventory transfers between warehouses and stores
 */

// GET /api/self-transfer - Get all transfers
router.get('/', authenticateToken, (req, res) => {
    try {
        const sql = `
            SELECT 
                id,
                sourceType,
                sourceId,
                destinationType,
                destinationId,
                transferStatus,
                requiresShipment,
                courierPartner,
                trackingId,
                estimatedDelivery,
                notes,
                transferDate,
                created_at,
                updated_at
            FROM inventory_transfers
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
            requiresShipment,
            courierPartner,
            trackingId,
            estimatedDelivery,
            notes,
            transferDate
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

        // Generate transfer ID
        const transferId = `TRF_${Date.now()}`;
        const shipmentId = requiresShipment ? `SHP_${Date.now()}` : null;

        // Create transfer record
        const insertSql = `
            INSERT INTO inventory_transfers (
                transferId, sourceType, sourceId, destinationType, destinationId,
                transferStatus, requiresShipment, courierPartner, trackingId,
                estimatedDelivery, notes, transferDate, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        db.query(insertSql, [
            transferId, sourceType, sourceId, destinationType, destinationId,
            requiresShipment ? 'IN_TRANSIT' : 'COMPLETED',
            requiresShipment, courierPartner, trackingId || shipmentId,
            estimatedDelivery, notes, transferDate
        ], (err, result) => {
            if (err) {
                console.error('Error creating transfer:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create transfer',
                    error: err.message
                });
            }

            // Insert transfer items
            const itemInsertSql = `
                INSERT INTO transfer_items (transferId, productId, quantity, unit, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `;

            let itemsInserted = 0;
            items.forEach(item => {
                db.query(itemInsertSql, [transferId, item.productId, item.transferQty, item.unit], (err) => {
                    if (err) console.error('Error inserting item:', err);
                    itemsInserted++;

                    // After all items inserted, create timeline events
                    if (itemsInserted === items.length) {
                        createTimelineEvents(transferId, sourceType, sourceId, destinationType, destinationId, items);
                    }
                });
            });

            res.json({
                success: true,
                message: 'Transfer initiated successfully',
                transferId: transferId,
                shipmentId: shipmentId
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

// Helper function to create timeline events
function createTimelineEvents(transferId, sourceType, sourceId, destinationType, destinationId, items) {
    const totalQty = items.reduce((sum, item) => sum + item.transferQty, 0);

    // TRANSFER_OUT event for source
    const outEventSql = `
        INSERT INTO timeline_events (
            entityType, entityId, eventType, source, destination, quantity,
            stockBefore, stockAfter, notes, transferId, isInitialTransfer, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(outEventSql, [
        sourceType, sourceId, 'TRANSFER_OUT',
        `${sourceType}_${sourceId}`, `${destinationType}_${destinationId}`,
        -totalQty, 0, 0, `Transferred to ${destinationType}`, transferId, false, 'COMPLETED'
    ], (err) => {
        if (err) console.error('Error creating TRANSFER_OUT event:', err);
    });

    // TRANSFER_IN event for destination
    const inEventSql = `
        INSERT INTO timeline_events (
            entityType, entityId, eventType, source, destination, quantity,
            stockBefore, stockAfter, notes, transferId, isInitialTransfer, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(inEventSql, [
        destinationType, destinationId, 'TRANSFER_IN',
        `${sourceType}_${sourceId}`, `${destinationType}_${destinationId}`,
        totalQty, 0, totalQty, `Received from ${sourceType}`, transferId, false, 'COMPLETED'
    ], (err) => {
        if (err) console.error('Error creating TRANSFER_IN event:', err);
    });
}

// GET /api/self-transfer/:id - Get transfer details
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT 
                t.*,
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'productId', ti.productId,
                        'quantity', ti.quantity,
                        'unit', ti.unit
                    )
                ) as items
            FROM inventory_transfers t
            LEFT JOIN transfer_items ti ON t.transferId = ti.transferId
            WHERE t.transferId = ?
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
        const { transferStatus, trackingId } = req.body;

        const updateSql = `
            UPDATE inventory_transfers
            SET transferStatus = ?, trackingId = ?, updated_at = NOW()
            WHERE transferId = ?
        `;

        db.query(updateSql, [transferStatus, trackingId, id], (err, result) => {
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
