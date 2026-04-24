const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

/**
 * TIMELINE ROUTES
 * Track all inventory events and movements
 */

// GET /api/timeline - Get timeline events
router.get('/', authenticateToken, (req, res) => {
    try {
        const { entityType, entityId, type } = req.query;

        let sql = `
            SELECT 
                id,
                entityType,
                entityId,
                eventType,
                source,
                destination,
                quantity,
                unit,
                stockBefore,
                stockAfter,
                notes,
                transferId,
                isInitialTransfer,
                status,
                created_at as timestamp
            FROM timeline_events
            WHERE 1=1
        `;

        const params = [];

        if (entityType && entityId) {
            sql += ` AND entityType = ? AND entityId = ?`;
            params.push(entityType, entityId);
        }

        if (type && type !== 'all') {
            sql += ` AND eventType = ?`;
            params.push(type);
        }

        sql += ` ORDER BY created_at DESC LIMIT 500`;

        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Error fetching timeline:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch timeline',
                    error: err.message
                });
            }

            res.json({
                success: true,
                timeline: results
            });
        });
    } catch (error) {
        console.error('Timeline API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// POST /api/timeline - Create timeline event (internal use)
router.post('/', authenticateToken, (req, res) => {
    try {
        const {
            entityType,
            entityId,
            eventType,
            source,
            destination,
            quantity,
            unit = 'pcs',
            stockBefore,
            stockAfter,
            notes,
            transferId,
            isInitialTransfer = false,
            status = 'COMPLETED'
        } = req.body;

        if (!entityType || !entityId || !eventType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const insertSql = `
            INSERT INTO timeline_events (
                entityType, entityId, eventType, source, destination, quantity, unit,
                stockBefore, stockAfter, notes, transferId, isInitialTransfer, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        db.query(insertSql, [
            entityType, entityId, eventType, source, destination, quantity, unit,
            stockBefore, stockAfter, notes, transferId, isInitialTransfer, status
        ], (err, result) => {
            if (err) {
                console.error('Error creating timeline event:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create event',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Event created successfully',
                eventId: result.insertId
            });
        });
    } catch (error) {
        console.error('Timeline creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/timeline/:barcode - Get timeline for specific product barcode
router.get('/:barcode', authenticateToken, (req, res) => {
    try {
        const { barcode } = req.params;
        const { warehouse, limit = 50, dateFrom, dateTo } = req.query;

        let sql = `
            SELECT 
                id,
                entityType,
                entityId,
                eventType,
                source,
                destination,
                quantity,
                unit,
                stockBefore,
                stockAfter,
                notes,
                transferId,
                isInitialTransfer,
                status,
                created_at as timestamp
            FROM timeline_events
            WHERE entityId = ?
        `;

        const params = [barcode];

        if (warehouse) {
            sql += ` AND (source = ? OR destination = ?)`;
            params.push(warehouse, warehouse);
        }

        if (dateFrom) {
            sql += ` AND created_at >= ?`;
            params.push(dateFrom);
        }

        if (dateTo) {
            sql += ` AND created_at <= ?`;
            params.push(dateTo);
        }

        sql += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Error fetching product timeline:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch product timeline',
                    error: err.message
                });
            }

            res.json({
                success: true,
                timeline: results,
                barcode: barcode,
                count: results.length
            });
        });
    } catch (error) {
        console.error('Product timeline error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/timeline/summary - Get timeline summary for dashboard
router.get('/summary/:entityType/:entityId', authenticateToken, (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        const sql = `
            SELECT 
                eventType,
                COUNT(*) as count,
                SUM(quantity) as totalQuantity,
                MAX(created_at) as lastEvent
            FROM timeline_events
            WHERE entityType = ? AND entityId = ?
            GROUP BY eventType
            ORDER BY lastEvent DESC
        `;

        db.query(sql, [entityType, entityId], (err, results) => {
            if (err) {
                console.error('Error fetching summary:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch summary',
                    error: err.message
                });
            }

            res.json({
                success: true,
                summary: results
            });
        });
    } catch (error) {
        console.error('Summary fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
