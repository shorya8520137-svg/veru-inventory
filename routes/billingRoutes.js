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
                    si.store_code,
                    COALESCE(pc.name, si.category, 'General') as category,
                    si.stock,
                    si.price,
                    si.gst_percentage,
                    si.last_updated,
                    si.created_at
                FROM store_inventory si
                LEFT JOIN dispatch_product dp ON BINARY si.barcode = BINARY dp.barcode
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
                store_code,
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
            JOIN dispatch_product dp ON BINARY si.barcode = BINARY dp.barcode
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
                JOIN dispatch_product dp ON BINARY si.barcode = BINARY dp.barcode
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

// POST /api/billing/generate - Generate invoice
router.post('/generate', authenticateToken, (req, res) => {
    const {
        store_code, bill_type, customer, gst_details, products,
        payment, discount, shipping, totals
    } = req.body;

    if (!customer?.name || !customer?.phone || !products || products.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!store_code) {
        return res.status(400).json({ success: false, message: 'Store code is required' });
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    db.getConnection((connErr, conn) => {
        if (connErr) {
            console.error('DB connection error:', connErr);
            return res.status(500).json({ success: false, message: 'Database connection failed' });
        }

        conn.beginTransaction((txErr) => {
            if (txErr) {
                conn.release();
                return res.status(500).json({ success: false, message: 'Transaction failed' });
            }

            function insertBill(useStoreCode) {
                const cols = [
                    'invoice_number', 'bill_type', 'customer_name', 'customer_phone',
                    'customer_email', 'billing_address', 'shipping_address',
                    'gstin', 'business_name', 'place_of_supply',
                    'subtotal', 'discount', 'shipping', 'gst_amount', 'grand_total',
                    'payment_mode', 'payment_status', 'items', 'total_items', 'created_at'
                ];
                const vals = [
                    invoiceNumber, bill_type || 'B2C',
                    customer.name, customer.phone, customer.email || null,
                    customer.billing_address || null, customer.shipping_address || null,
                    gst_details?.gstin || null, gst_details?.business_name || null,
                    gst_details?.place_of_supply || null,
                    totals.subtotal, discount || 0, shipping || 0,
                    totals.gstAmount, totals.grandTotal,
                    payment.mode, payment.status,
                    JSON.stringify(products), products.length
                ];
                if (useStoreCode) {
                    cols.splice(19, 0, 'store_code');
                    vals.splice(19, 0, store_code);
                }
                const sql = `INSERT INTO bills (${cols.join(', ')}) VALUES (${vals.map(() => '?').join(', ')})`;
                conn.query(sql, vals, afterInsertBill);
            }

            function afterInsertBill(billErr, billResult) {
                if (billErr) {
                    // If store_code column missing, retry without it
                    if (billErr.message && billErr.message.includes("Unknown column 'store_code'")) {
                        return insertBill(false);
                    }
                    return conn.rollback(() => {
                        conn.release();
                        res.status(500).json({ success: false, message: 'Failed to create bill', error: billErr.message });
                    });
                }

                let processed = 0;
                let hasError = false;

                products.forEach((product) => {
                    conn.query(
                        `SELECT stock FROM store_inventory WHERE barcode = ? AND store_code = ?`,
                        [product.barcode, store_code],
                        (stockErr, stockRows) => {
                            if (hasError) return;

                            if (stockErr || stockRows.length === 0) {
                                hasError = true;
                                return conn.rollback(() => {
                                    conn.release();
                                    res.status(400).json({
                                        success: false,
                                        message: `Product ${product.product_name} not found in store ${store_code} inventory`
                                    });
                                });
                            }

                            const currentStock = stockRows[0].stock;
                            if (currentStock < product.quantity) {
                                hasError = true;
                                return conn.rollback(() => {
                                    conn.release();
                                    res.status(400).json({
                                        success: false,
                                        message: `Insufficient stock for ${product.product_name}. Available: ${currentStock}, Required: ${product.quantity}`
                                    });
                                });
                            }

                            conn.query(
                                `UPDATE store_inventory SET stock = stock - ?, last_updated = NOW() WHERE barcode = ?`,
                                [product.quantity, product.barcode],
                                (updErr) => {
                                    if (hasError) return;
                                    if (updErr) {
                                        hasError = true;
                                        return conn.rollback(() => {
                                            conn.release();
                                            res.status(500).json({ success: false, message: 'Failed to update stock' });
                                        });
                                    }

                                    conn.query(
                                        `INSERT INTO store_inventory_logs (barcode, product_name, movement_type, quantity, reference_id, reference_type, created_at)
                                         VALUES (?, ?, 'SALE', ?, ?, 'BILL', NOW())`,
                                        [product.barcode, product.product_name, product.quantity, invoiceNumber],
                                        (logErr) => {
                                            if (logErr) console.error('Log error:', logErr);

                                            processed++;
                                            if (processed === products.length && !hasError) {
                                                conn.commit((commitErr) => {
                                                    if (commitErr) {
                                                        return conn.rollback(() => {
                                                            conn.release();
                                                            res.status(500).json({ success: false, message: 'Commit failed' });
                                                        });
                                                    }
                                                    conn.release();
                                                    res.json({
                                                        success: true,
                                                        message: 'Invoice generated successfully',
                                                        data: { bill_id: billResult.insertId, invoice_number: invoiceNumber }
                                                    });
                                                });
                                            }
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });
        });
    });
});

// GET /api/billing/history - Get bill history with pagination and filters
router.get('/history', authenticateToken, (req, res) => {
    try {
        const {
            page = 1,
            limit = 15,
            search = '',
            status = 'all'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = [];
        let queryParams = [];

        if (search && search.trim()) {
            whereConditions.push(`(
                invoice_number LIKE ? OR 
                customer_name LIKE ? OR 
                customer_phone LIKE ?
            )`);
            const searchPattern = `%${search.trim()}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (status !== 'all') {
            whereConditions.push('payment_status = ?');
            queryParams.push(status);
        }

        const whereClause = whereConditions.length > 0
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM bills ${whereClause}`;

        db.query(countSql, queryParams, (err, countResult) => {
            if (err) {
                console.error('Error counting bills:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to count bills',
                    error: err.message
                });
            }

            const total = countResult[0].total;

            function fetchBills(includeStoreCode) {
                const selectCols = [
                    'id', 'invoice_number', 'customer_name', 'customer_phone',
                    'customer_email', 'subtotal', 'discount', 'shipping',
                    'gst_amount', 'grand_total', 'payment_mode', 'payment_status',
                    'items', 'total_items', 'created_at'
                ];
                if (includeStoreCode) selectCols.splice(14, 0, 'store_code');
                const sql = `SELECT ${selectCols.join(', ')} FROM bills ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                db.query(sql, [...queryParams, parseInt(limit), offset], (err, results) => {
                    if (err) {
                        if (err.message && err.message.includes("Unknown column 'store_code'") && includeStoreCode) {
                            return fetchBills(false);
                        }
                        console.error('Error fetching bills:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to fetch bills',
                            error: err.message
                        });
                    }

                    res.json({
                        success: true,
                        data: results,
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit)
                    });
                });
            }
            fetchBills(true);
        });

    } catch (error) {
        console.error('Bill history API error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;