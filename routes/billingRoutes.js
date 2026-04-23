const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

/**
 * BILLING ROUTES
 * Handle store inventory and billing related operations
 */

// GET /api/billing/store-inventory - Get store inventory with pagination and filters
router.get('/store-inventory', authenticateToken, (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            stock_filter = 'all',
            store_filter = 'all'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build WHERE clause
        let whereConditions = [];
        let queryParams = [];

        // Search filter
        if (search && search.trim()) {
            whereConditions.push('(product_name LIKE ? OR barcode LIKE ?)');
            queryParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }

        // Store filter (if store_inventory table has store_code column)
        if (store_filter !== 'all') {
            whereConditions.push('store_code = ?');
            queryParams.push(store_filter);
        }

        // Stock filter
        if (stock_filter !== 'all') {
            switch (stock_filter) {
                case 'in_stock':
                    whereConditions.push('stock > 10');
                    break;
                case 'low_stock':
                    whereConditions.push('stock > 0 AND stock <= 10');
                    break;
                case 'out_of_stock':
                    whereConditions.push('stock = 0');
                    break;
            }
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM store_inventory ${whereClause}`;
        
        db.query(countSql, queryParams, (err, countResult) => {
            if (err) {
                console.error('Error counting inventory:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to count inventory',
                    error: err.message
                });
            }

            const total = countResult[0].total;

            // Get inventory data
            const dataSql = `
                SELECT 
                    id,
                    product_name,
                    barcode,
                    category,
                    stock,
                    price,
                    gst_percentage,
                    last_updated,
                    created_at
                FROM store_inventory 
                ${whereClause}
                ORDER BY product_name ASC
                LIMIT ? OFFSET ?
            `;

            const dataParams = [...queryParams, parseInt(limit), offset];

            db.query(dataSql, dataParams, (err, results) => {
                if (err) {
                    console.error('Error fetching inventory:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch inventory',
                        error: err.message
                    });
                }

                // Get stats
                const statsSql = `
                    SELECT 
                        COUNT(*) as totalProducts,
                        SUM(CASE WHEN stock > 0 AND stock <= 10 THEN 1 ELSE 0 END) as lowStock,
                        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as outOfStock,
                        SUM(stock * price) as totalValue
                    FROM store_inventory
                `;

                db.query(statsSql, (err, statsResult) => {
                    if (err) {
                        console.error('Error fetching stats:', err);
                        // Continue without stats
                    }

                    const stats = statsResult ? statsResult[0] : {
                        totalProducts: 0,
                        lowStock: 0,
                        outOfStock: 0,
                        totalValue: 0
                    };

                    res.json({
                        success: true,
                        data: results,
                        total: total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        stats: {
                            totalProducts: stats.totalProducts || 0,
                            lowStock: stats.lowStock || 0,
                            outOfStock: stats.outOfStock || 0,
                            totalValue: parseFloat(stats.totalValue || 0)
                        }
                    });
                });
            });
        });

    } catch (error) {
        console.error('Store inventory API error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/billing/store-inventory/:id - Get specific inventory item
router.get('/store-inventory/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT 
                id,
                product_name,
                barcode,
                category,
                stock,
                price,
                gst_percentage,
                last_updated,
                created_at
            FROM store_inventory 
            WHERE id = ?
        `;

        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('Error fetching inventory item:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch inventory item',
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Inventory item not found'
                });
            }

            res.json({
                success: true,
                data: results[0]
            });
        });

    } catch (error) {
        console.error('Store inventory item API error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// PUT /api/billing/store-inventory/:id - Update inventory item
router.put('/store-inventory/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { stock, price } = req.body;

        const sql = `
            UPDATE store_inventory 
            SET stock = ?, price = ?, last_updated = NOW()
            WHERE id = ?
        `;

        db.query(sql, [stock, price, id], (err, result) => {
            if (err) {
                console.error('Error updating inventory:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update inventory',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Inventory item not found'
                });
            }

            res.json({
                success: true,
                message: 'Inventory updated successfully'
            });
        });

    } catch (error) {
        console.error('Store inventory update API error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;