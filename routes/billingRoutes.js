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
            whereConditions.push('(si.product_name LIKE ? OR si.barcode LIKE ?)');
            queryParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }

        // Store filter (if store_inventory table has store_code column)
        if (store_filter !== 'all') {
            whereConditions.push('si.store_code = ?');
            queryParams.push(store_filter);
        }

        // Stock filter
        if (stock_filter !== 'all') {
            switch (stock_filter) {
                case 'in_stock':
                    whereConditions.push('si.stock > 10');
                    break;
                case 'low_stock':
                    whereConditions.push('si.stock > 0 AND si.stock <= 10');
                    break;
                case 'out_of_stock':
                    whereConditions.push('si.stock = 0');
                    break;
            }
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM store_inventory si ${whereClause}`;
        
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

            // Get inventory data with proper product names from dispatch_product table
            const dataSql = `
                SELECT 
                    si.id,
                    COALESCE(dp.product_name, si.product_name, si.barcode) as product_name,
                    si.barcode,
                    COALESCE(pc.name, si.category, 'General') as category,
                    si.stock,
                    si.price,
                    si.gst_percentage,
                    si.last_updated,
                    si.created_at
                FROM store_inventory si
                LEFT JOIN dispatch_product dp ON si.barcode COLLATE utf8mb4_unicode_ci = dp.barcode COLLATE utf8mb4_unicode_ci
                LEFT JOIN product_categories pc ON dp.category_id = pc.id
                ${whereClause}
                ORDER BY COALESCE(dp.product_name, si.product_name, si.barcode) ASC
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

// POST /api/billing/fix-product-names - Fix product names in store inventory
router.post('/fix-product-names', authenticateToken, (req, res) => {
    try {
        console.log('🔧 Starting product name fix for store inventory...');
        
        // Update product names where they are currently showing barcode or "Transferred"
        const updateProductNamesSql = `
            UPDATE store_inventory si
            JOIN dispatch_product dp ON si.barcode COLLATE utf8mb4_unicode_ci = dp.barcode COLLATE utf8mb4_unicode_ci
            SET si.product_name = dp.product_name
            WHERE si.product_name = si.barcode 
               OR si.product_name = 'Transferred'
               OR si.product_name IS NULL
               OR si.product_name = ''
        `;

        db.query(updateProductNamesSql, (err, result) => {
            if (err) {
                console.error('Error updating product names:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update product names',
                    error: err.message
                });
            }

            console.log(`✅ Updated ${result.affectedRows} product names`);

            // Update categories as well
            const updateCategoriesSql = `
                UPDATE store_inventory si
                JOIN dispatch_product dp ON si.barcode COLLATE utf8mb4_unicode_ci = dp.barcode COLLATE utf8mb4_unicode_ci
                JOIN product_categories pc ON dp.category_id = pc.id
                SET si.category = pc.name
                WHERE si.category = 'Transferred'
                   OR si.category IS NULL
                   OR si.category = ''
            `;

            db.query(updateCategoriesSql, (err, categoryResult) => {
                if (err) {
                    console.error('Error updating categories:', err);
                    // Don't fail the whole operation for category update
                }

                console.log(`✅ Updated ${categoryResult?.affectedRows || 0} categories`);

                // Get sample of fixed products
                const sampleSql = `
                    SELECT 
                        barcode,
                        product_name,
                        category,
                        stock
                    FROM store_inventory 
                    ORDER BY last_updated DESC
                    LIMIT 10
                `;

                db.query(sampleSql, (err, sampleResults) => {
                    res.json({
                        success: true,
                        message: `Fixed ${result.affectedRows} product names and ${categoryResult?.affectedRows || 0} categories`,
                        productNamesFixed: result.affectedRows,
                        categoriesFixed: categoryResult?.affectedRows || 0,
                        sampleProducts: sampleResults || []
                    });
                });
            });
        });
    } catch (error) {
        console.error('Fix product names error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;