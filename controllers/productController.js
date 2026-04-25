const db = require('../db/connection');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');

class ProductController {

    // ===============================
    // GET PRODUCTS WITH INVENTORY
    // ===============================
    static getAllProducts(req, res) {
        const page = parseInt(req.query.page || 1);
        const limit = parseInt(req.query.limit || 20);
        const search = req.query.search || '';
        const category = req.query.category || '';
        const offset = (page - 1) * limit;

        let where = 'WHERE p.is_active = 1';
        const params = [];

        if (search) {
            where += ' AND (p.product_name LIKE ? OR p.barcode LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            where += ' AND c.name = ?';
            params.push(category);
        }

        const dataSql = `
            SELECT 
                p.p_id,
                p.product_name,
                p.product_variant,
                p.barcode,
                p.price,
                p.cost_price,
                p.weight,
                p.dimensions,
                p.description,
                p.category_id,
                p.created_at,
                c.display_name AS category_display_name,
                COALESCE(SUM(i.stock), 0) as total_stock,
                COUNT(DISTINCT i.warehouse) as warehouse_count
            FROM dispatch_product p
            LEFT JOIN product_categories c ON p.category_id = c.id
            LEFT JOIN inventory i ON p.barcode = i.code
            ${where}
            GROUP BY p.p_id, p.product_name, p.product_variant, p.barcode, p.price, p.cost_price, p.weight, p.dimensions, p.description, p.category_id, p.created_at, c.display_name
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(DISTINCT p.p_id) AS total
            FROM dispatch_product p
            LEFT JOIN product_categories c ON p.category_id = c.id
            ${where}
        `;

        db.query(dataSql, [...params, limit, offset], (err, rows) => {
            if (err) {
                console.error('getAllProducts:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to fetch products' 
                });
            }

            db.query(countSql, params, (err2, countRows) => {
                if (err2) {
                    console.error('countProducts:', err2);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to count products' 
                    });
                }

                res.json({
                    success: true,
                    data: {
                        products: rows,
                        pagination: {
                            page,
                            limit,
                            total: countRows[0].total,
                            pages: Math.ceil(countRows[0].total / limit)
                        }
                    }
                });
            });
        });
    }

    // ===============================
    // GET WAREHOUSES
    // ===============================
    static getWarehouses(req, res) {
        db.query(
            'SELECT w_id, warehouse_code, Warehouse_name, address FROM dispatch_warehouse ORDER BY Warehouse_name',
            (err, rows) => {
                if (err) {
                    console.error('getWarehouses:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to fetch warehouses' 
                    });
                }
                res.json({ success: true, data: rows });
            }
        );
    }

    // ===============================
    // GET STORES
    // ===============================
    static getStores(req, res) {
        db.query(
            'SELECT id, store_code, store_name, city, state FROM stores WHERE is_active = 1 ORDER BY store_name',
            (err, rows) => {
                if (err) {
                    console.error('getStores:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to fetch stores' 
                    });
                }
                res.json({ success: true, data: rows });
            }
        );
    }

    // ===============================
    // CREATE PRODUCT
    // ===============================
    static createProduct(req, res) {
        const {
            product_name,
            product_variant,
            barcode,
            description,
            category_id,
            price,
            cost_price,
            weight,
            dimensions,
            warehouse,
            stock_quantity
        } = req.body;

        if (!product_name || !barcode) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product name and barcode are required' 
            });
        }

        const sql = `
            INSERT INTO dispatch_product
            (product_name, product_variant, barcode, description, category_id, price, cost_price, weight, dimensions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            product_name,
            product_variant || null,
            barcode,
            description || null,
            category_id || null,
            price || null,
            cost_price || null,
            weight || null,
            dimensions || null
        ], (err, result) => {
            if (err) {
                console.error('createProduct:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Barcode already exists' 
                    });
                }
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to create product' 
                });
            }

            // If warehouse and stock_quantity are provided, add to inventory
            if (warehouse && stock_quantity && parseInt(stock_quantity) > 0) {
                const quantity = parseInt(stock_quantity);
                const reference = `OPENING_${barcode}_${Date.now()}`;
                
                // Insert into inventory_ledger_base
                const ledgerSql = `
                    INSERT INTO inventory_ledger_base (
                        event_time,
                        movement_type,
                        barcode,
                        product_name,
                        location_code,
                        qty,
                        direction,
                        reference
                    ) VALUES (NOW(), 'OPENING', ?, ?, ?, ?, 'IN', ?)
                `;
                
                db.query(ledgerSql, [
                    barcode,
                    product_name,
                    warehouse,
                    quantity,
                    reference
                ], (ledgerErr) => {
                    if (ledgerErr) {
                        console.error('Error adding to inventory ledger:', ledgerErr);
                    }
                });
                
                // Insert into stock_batches
                const batchSql = `
                    INSERT INTO stock_batches (
                        product_name,
                        barcode,
                        variant,
                        warehouse,
                        source_type,
                        qty_initial,
                        qty_available,
                        unit_cost,
                        status
                    ) VALUES (?, ?, ?, ?, 'OPENING', ?, ?, 0, 'active')
                `;
                
                db.query(batchSql, [
                    product_name,
                    barcode,
                    product_variant || null,
                    warehouse,
                    quantity,
                    quantity
                ], (batchErr) => {
                    if (batchErr) {
                        console.error('Error adding to stock_batches:', batchErr);
                    }
                });
            }

            // Log PRODUCT_CREATE audit using PermissionsController
            if (req.user) {
                const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                                 req.headers['x-real-ip'] ||
                                 req.connection.remoteAddress ||
                                 req.ip ||
                                 '127.0.0.1';
                
                const PermissionsController = require('../controllers/permissionsController');
                PermissionsController.createAuditLog(req.user.id, 'CREATE', 'PRODUCT', result.insertId, {
                    user_name: req.user.name || 'Unknown',
                    user_email: req.user.email || 'Unknown',
                    product_name,
                    product_variant,
                    barcode,
                    description,
                    price,
                    cost_price,
                    warehouse: warehouse || 'N/A',
                    stock_quantity: stock_quantity || 0,
                    create_time: new Date().toISOString(),
                    ip_address: ipAddress,
                    user_agent: req.get('User-Agent') || 'Unknown'
                });
            }

            res.json({ 
                success: true, 
                message: warehouse && stock_quantity 
                    ? `Product created successfully and ${stock_quantity} units added to ${warehouse}` 
                    : 'Product created successfully'
            });
        });
    }

    // ===============================
    // UPDATE PRODUCT
    // ===============================
    static updateProduct(req, res) {
        const { id } = req.params;
        const {
            product_name,
            product_variant,
            barcode,
            description,
            category_id,
            price,
            cost_price,
            weight,
            dimensions
        } = req.body;

        if (!product_name || !barcode) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product name and barcode are required' 
            });
        }

        const sql = `
            UPDATE dispatch_product SET
                product_name = ?,
                product_variant = ?,
                barcode = ?,
                description = ?,
                category_id = ?,
                price = ?,
                cost_price = ?,
                weight = ?,
                dimensions = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE p_id = ?
        `;

        db.query(sql, [
            product_name,
            product_variant || null,
            barcode,
            description || null,
            category_id || null,
            price || null,
            cost_price || null,
            weight || null,
            dimensions || null,
            id
        ], (err, result) => {
            if (err) {
                console.error('updateProduct:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Barcode already exists' 
                    });
                }
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to update product' 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Product not found' 
                });
            }

            // Log PRODUCT_UPDATE audit using PermissionsController
            if (req.user) {
                const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                                 req.headers['x-real-ip'] ||
                                 req.connection.remoteAddress ||
                                 req.ip ||
                                 '127.0.0.1';
                
                const PermissionsController = require('../controllers/permissionsController');
                PermissionsController.createAuditLog(req.user.id, 'UPDATE', 'PRODUCT', id, {
                    user_name: req.user.name || 'Unknown',
                    user_email: req.user.email || 'Unknown',
                    product_name,
                    product_variant,
                    barcode,
                    description,
                    price,
                    cost_price,
                    update_time: new Date().toISOString(),
                    ip_address: ipAddress,
                    user_agent: req.get('User-Agent') || 'Unknown'
                });
            }

            res.json({ 
                success: true, 
                message: 'Product updated successfully' 
            });
        });
    }

    // ===============================
    // DELETE PRODUCT
    // ===============================
    static deleteProduct(req, res) {
        const { id } = req.params;

        db.query(
            'UPDATE dispatch_product SET is_active = 0 WHERE p_id = ?',
            [id],
            (err, result) => {
                if (err) {
                    console.error('deleteProduct:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to delete product' 
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Product not found' 
                    });
                }

                // Log PRODUCT_DELETE audit using PermissionsController
                if (req.user) {
                    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                                     req.headers['x-real-ip'] ||
                                     req.connection.remoteAddress ||
                                     req.ip ||
                                     '127.0.0.1';
                    
                    const PermissionsController = require('../controllers/permissionsController');
                    PermissionsController.createAuditLog(req.user.id, 'DELETE', 'PRODUCT', id, {
                        user_name: req.user.name || 'Unknown',
                        user_email: req.user.email || 'Unknown',
                        product_id: id,
                        delete_time: new Date().toISOString(),
                        ip_address: ipAddress,
                        user_agent: req.get('User-Agent') || 'Unknown'
                    });
                }

                res.json({ 
                    success: true, 
                    message: 'Product deleted successfully' 
                });
            }
        );
    }

    // ===============================
    // SEARCH PRODUCT BY BARCODE
    // ===============================
    static searchByBarcode(req, res) {
        const { barcode } = req.params;

        if (!barcode) {
            return res.status(400).json({ 
                success: false, 
                message: 'Barcode is required' 
            });
        }

        const sql = `
            SELECT 
                p.p_id,
                p.product_name,
                p.product_variant,
                p.barcode,
                p.price,
                p.cost_price,
                p.weight,
                p.dimensions,
                p.description,
                p.category_id,
                p.created_at,
                c.display_name AS category_display_name,
                COALESCE(SUM(i.stock), 0) as total_stock,
                COUNT(DISTINCT i.warehouse) as warehouse_count
            FROM dispatch_product p
            LEFT JOIN product_categories c ON p.category_id = c.id
            LEFT JOIN inventory i ON p.barcode = i.code
            WHERE p.barcode = ? AND p.is_active = 1
            GROUP BY p.p_id, p.product_name, p.product_variant, p.barcode, p.price, p.cost_price, p.weight, p.dimensions, p.description, p.category_id, p.created_at, c.display_name
        `;

        db.query(sql, [barcode], (err, rows) => {
            if (err) {
                console.error('searchByBarcode:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to search product' 
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Product not found with this barcode' 
                });
            }

            res.json({
                success: true,
                data: rows[0]
            });
        });
    }

    // ===============================
    // TRANSFER PRODUCT TO INVENTORY
    // ===============================
    static transferProduct(req, res) {
        const {
            product_id,
            product_name,
            barcode,
            product_variant,
            quantity,
            warehouse_code,
            store_code,
            location_type, // 'warehouse' or 'store'
            notes
        } = req.body;

        if (!product_id || !barcode || !quantity || quantity <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID, barcode and valid quantity are required' 
            });
        }

        if (!warehouse_code && !store_code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Either warehouse or store must be selected' 
            });
        }

        // Determine the location details
        let locationName = '';
        let locationCode = '';

        if (location_type === 'warehouse' && warehouse_code) {
            locationName = warehouse_code;
            locationCode = warehouse_code;
        } else if (location_type === 'store' && store_code) {
            locationName = store_code;
            locationCode = store_code;
        }

        // Check if inventory record already exists
        const checkSql = `
            SELECT id, stock FROM inventory 
            WHERE code = ? AND warehouse = ? AND warehouse_code = ?
        `;

        db.query(checkSql, [barcode, locationName, locationCode], (err, existing) => {
            if (err) {
                console.error('checkInventory:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to check existing inventory' 
                });
            }

            if (existing.length > 0) {
                // Update existing inventory
                const updateSql = `
                    UPDATE inventory SET
                        stock = stock + ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                db.query(updateSql, [quantity, existing[0].id], (updateErr) => {
                    if (updateErr) {
                        console.error('updateInventory:', updateErr);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Failed to update inventory' 
                        });
                    }

                    const newStock = existing[0].stock + quantity;
                    res.json({ 
                        success: true, 
                        message: `Successfully transferred ${quantity} units to ${locationName}. New stock: ${newStock}`,
                        data: {
                            inventory_id: existing[0].id,
                            quantity_added: quantity,
                            new_stock: newStock,
                            location: locationName,
                            location_type
                        }
                    });
                });
            } else {
                // Create new inventory record
                const insertSql = `
                    INSERT INTO inventory 
                    (product, code, variant, warehouse, warehouse_code, stock, opening, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;

                db.query(insertSql, [
                    product_name,
                    barcode,
                    product_variant || null,
                    locationName,
                    locationCode,
                    quantity,
                    quantity // opening stock same as initial stock
                ], (insertErr, result) => {
                    if (insertErr) {
                        console.error('insertInventory:', insertErr);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Failed to create inventory record' 
                        });
                    }

                    res.json({ 
                        success: true, 
                        message: `Successfully transferred ${quantity} units to ${locationName}. New inventory created.`,
                        data: {
                            inventory_id: result.insertId,
                            quantity_added: quantity,
                            new_stock: quantity,
                            location: locationName,
                            location_type
                        }
                    });
                });
            }
        });
    }

    // ===============================
    // GET PRODUCT INVENTORY
    // ===============================
    static getProductInventory(req, res) {
        const { barcode } = req.params;

        const sql = `
            SELECT 
                i.*,
                w.Warehouse_name,
                s.store_name,
                s.city,
                s.state
            FROM inventory i
            LEFT JOIN dispatch_warehouse w ON i.warehouse_code = w.warehouse_code
            LEFT JOIN stores s ON i.warehouse_code = s.store_code
            WHERE i.code = ?
            ORDER BY i.stock DESC
        `;

        db.query(sql, [barcode], (err, rows) => {
            if (err) {
                console.error('getProductInventory:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to fetch product inventory' 
                });
            }

            const totalStock = rows.reduce((sum, item) => sum + item.stock, 0);

            res.json({
                success: true,
                data: {
                    inventory: rows,
                    total_stock: totalStock,
                    locations: rows.length
                }
            });
        });
    }

    // ===============================
    // BULK TRANSFER PRODUCTS TO INVENTORY
    // ===============================
    static bulkTransferProducts(req, res) {
        const { products, location_type, warehouse_code, store_code, notes } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Products array is required and cannot be empty' 
            });
        }

        if (!warehouse_code && !store_code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Either warehouse or store must be selected' 
            });
        }

        // Determine the location details
        let locationName = '';
        let locationCode = '';

        if (location_type === 'warehouse' && warehouse_code) {
            locationName = warehouse_code;
            locationCode = warehouse_code;
        } else if (location_type === 'store' && store_code) {
            locationName = store_code;
            locationCode = store_code;
        }

        let completed = 0;
        let successful = 0;
        let errors = [];

        products.forEach((product, index) => {
            const { product_id, product_name, barcode, product_variant, quantity } = product;

            if (!product_id || !barcode || !quantity || quantity <= 0) {
                completed++;
                errors.push(`Product ${index + 1}: Missing required fields or invalid quantity`);
                
                if (completed === products.length) {
                    sendBulkTransferResponse(res, successful, errors, locationName);
                }
                return;
            }

            // Check if inventory record already exists
            const checkSql = `
                SELECT id, stock FROM inventory 
                WHERE code = ? AND warehouse = ? AND warehouse_code = ?
            `;

            db.query(checkSql, [barcode, locationName, locationCode], (err, existing) => {
                if (err) {
                    completed++;
                    errors.push(`Product ${index + 1}: Database error checking inventory`);
                    
                    if (completed === products.length) {
                        sendBulkTransferResponse(res, successful, errors, locationName);
                    }
                    return;
                }

                if (existing.length > 0) {
                    // Update existing inventory
                    const updateSql = `
                        UPDATE inventory SET
                            stock = stock + ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `;

                    db.query(updateSql, [quantity, existing[0].id], (updateErr) => {
                        completed++;
                        
                        if (updateErr) {
                            errors.push(`Product ${index + 1}: Failed to update inventory`);
                        } else {
                            successful++;
                        }

                        if (completed === products.length) {
                            sendBulkTransferResponse(res, successful, errors, locationName);
                        }
                    });
                } else {
                    // Create new inventory record
                    const insertSql = `
                        INSERT INTO inventory 
                        (product, code, variant, warehouse, warehouse_code, stock, opening, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    `;

                    db.query(insertSql, [
                        product_name,
                        barcode,
                        product_variant || null,
                        locationName,
                        locationCode,
                        quantity,
                        quantity // opening stock same as initial stock
                    ], (insertErr) => {
                        completed++;
                        
                        if (insertErr) {
                            errors.push(`Product ${index + 1}: Failed to create inventory record`);
                        } else {
                            successful++;
                        }

                        if (completed === products.length) {
                            sendBulkTransferResponse(res, successful, errors, locationName);
                        }
                    });
                }
            });
        });
    }

    // ===============================
    // BULK IMPORT
    // ===============================
    static bulkImport(req, res) {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const ext = req.file.originalname.split('.').pop().toLowerCase();
        let products = [];

        try {
            if (ext === 'csv') {
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (row) => products.push(row))
                    .on('end', () => insertProducts(products, req, res))
                    .on('error', (err) => {
                        console.error('CSV parsing error:', err);
                        res.status(400).json({ 
                            success: false, 
                            message: 'Invalid CSV file format' 
                        });
                    });
            } else if (['xlsx', 'xls'].includes(ext)) {
                const wb = XLSX.readFile(req.file.path);
                products = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                insertProducts(products, req, res);
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Unsupported file format. Please use CSV or Excel files.' 
                });
            }
        } catch (error) {
            console.error('Bulk import error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to process file' 
            });
        }
    }

    // ===============================
    // BULK IMPORT WITH PROGRESS
    // ===============================
    static bulkImportWithProgress(req, res) {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const ext = req.file.originalname.split('.').pop().toLowerCase();
        let products = [];

        try {
            if (ext === 'csv') {
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (row) => products.push(row))
                    .on('end', () => insertProductsWithProgress(products, req, res))
                    .on('error', (err) => {
                        console.error('CSV parsing error:', err);
                        res.status(400).json({ 
                            success: false, 
                            message: 'Invalid CSV file format' 
                        });
                    });
            } else if (['xlsx', 'xls'].includes(ext)) {
                const wb = XLSX.readFile(req.file.path);
                products = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                insertProductsWithProgress(products, req, res);
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Unsupported file format. Please use CSV or Excel files.' 
                });
            }
        } catch (error) {
            console.error('Bulk import error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to process file' 
            });
        }
    }

    // ===============================
    // GET INVENTORY WITH FILTERS
    // ===============================
    static getInventory(req, res) {
        const page = parseInt(req.query.page || 1);
        const limit = parseInt(req.query.limit || 20);
        const search = req.query.search || '';
        const warehouse = req.query.warehouse || ''; // Changed from warehouses to warehouse
        const warehouses = req.query.warehouses || ''; // Keep for backward compatibility
        const stockFilter = req.query.stockFilter || 'all';
        const sortBy = req.query.sortBy || 'product_name';
        const sortOrder = req.query.sortOrder || 'asc';
        const dateFrom = req.query.dateFrom || '';
        const dateTo = req.query.dateTo || '';
        const offset = (page - 1) * limit;

        console.log('📦 Backend getInventory called with:', {
            warehouse,
            warehouses,
            dateFrom,
            dateTo,
            search,
            stockFilter,
            sortBy,
            sortOrder,
            page,
            limit
        });

        let where = 'WHERE 1=1';
        const params = [];

        // Search filter
        if (search) {
            where += ' AND (i.product LIKE ? OR i.code LIKE ? OR i.variant LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Warehouse filter - handle both single warehouse and multiple warehouses
        if (warehouse) {
            // Single warehouse filter (new format)
            where += ' AND sb.warehouse = ?';
            params.push(warehouse);
            console.log('🏢 Filtering by single warehouse:', warehouse);
        } else if (warehouses) {
            // Multiple warehouses filter (old format for backward compatibility)
            const warehouseList = warehouses.split(',').filter(w => w.trim());
            if (warehouseList.length > 0) {
                const placeholders = warehouseList.map(() => '?').join(',');
                where += ` AND sb.warehouse IN (${placeholders})`;
                params.push(...warehouseList);
                console.log('🏢 Filtering by multiple warehouses:', warehouseList);
            }
        }

        // Date range filter
        if (dateFrom) {
            where += ' AND DATE(i.created_at) >= ?';
            params.push(dateFrom);
            console.log('📅 Date from filter:', dateFrom);
        }
        
        if (dateTo) {
            where += ' AND DATE(i.created_at) <= ?';
            params.push(dateTo);
            console.log('📅 Date to filter:', dateTo);
        }

        // Stock filter
        if (stockFilter === 'in-stock') {
            where += ' AND i.stock > 10';
        } else if (stockFilter === 'low-stock') {
            where += ' AND i.stock > 0 AND i.stock <= 10';
        } else if (stockFilter === 'out-of-stock') {
            where += ' AND i.stock = 0';
        }

        // Sort mapping
        const sortMapping = {
            'product_name': 'i.product',
            'stock': 'i.stock',
            'warehouse': 'i.warehouse',
            'updated_at': 'i.updated_at'
        };
        const sortColumn = sortMapping[sortBy] || 'i.product';
        const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

        // Main query - Updated to use stock_batches table
        const dataSql = `
            SELECT 
                sb.id,
                sb.product_name as product,
                sb.barcode as code,
                sb.variant,
                sb.warehouse,
                sb.warehouse as warehouse_code,
                sb.qty_available as stock,
                sb.qty_initial as opening,
                sb.created_at,
                sb.created_at as updated_at,
                w.Warehouse_name,
                s.store_name,
                s.city,
                s.state
            FROM stock_batches sb
            LEFT JOIN dispatch_warehouse w ON sb.warehouse = w.warehouse_code
            LEFT JOIN stores s ON sb.warehouse = s.store_code
            ${where}
            AND sb.status = 'active'
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;

        // Count query - Updated to use stock_batches table
        const countSql = `
            SELECT COUNT(*) AS total
            FROM stock_batches sb
            LEFT JOIN dispatch_warehouse w ON sb.warehouse = w.warehouse_code
            LEFT JOIN stores s ON sb.warehouse = s.store_code
            ${where}
            AND sb.status = 'active'
        `;

        // Stats query - Updated to use stock_batches table
        const statsSql = `
            SELECT 
                COUNT(DISTINCT sb.barcode) as totalProducts,
                SUM(sb.qty_available) as totalStock,
                COUNT(CASE WHEN sb.qty_available > 0 AND sb.qty_available <= 10 THEN 1 END) as lowStockItems,
                COUNT(CASE WHEN sb.qty_available = 0 THEN 1 END) as outOfStockItems
            FROM stock_batches sb
            LEFT JOIN dispatch_warehouse w ON sb.warehouse = w.warehouse_code
            LEFT JOIN stores s ON sb.warehouse = s.store_code
            ${where}
            AND sb.status = 'active'
        `;

        console.log('🔍 Final SQL WHERE clause:', where);
        console.log('🔍 SQL Parameters:', params);
        console.log('🔍 Complete SQL Query:', dataSql);

        // Execute queries
        db.query(dataSql, [...params, limit, offset], (err, rows) => {
            if (err) {
                console.error('getInventory:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to fetch inventory' 
                });
            }

            db.query(countSql, params, (err2, countRows) => {
                if (err2) {
                    console.error('countInventory:', err2);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to count inventory' 
                    });
                }

                db.query(statsSql, params, (err3, statsRows) => {
                    if (err3) {
                        console.error('statsInventory:', err3);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Failed to get inventory stats' 
                        });
                    }

                    res.json({
                        success: true,
                        data: {
                            inventory: rows,
                            pagination: {
                                page,
                                limit,
                                total: countRows[0].total,
                                pages: Math.ceil(countRows[0].total / limit)
                            },
                            stats: statsRows[0] || {
                                totalProducts: 0,
                                totalStock: 0,
                                lowStockItems: 0,
                                outOfStockItems: 0
                            }
                        }
                    });
                });
            });
        });
    }

    // ===============================
    // GET INVENTORY BY WAREHOUSE
    // ===============================
    static getInventoryByWarehouse(req, res) {
        const { warehouse } = req.params;
        const page = parseInt(req.query.page || 1);
        const limit = parseInt(req.query.limit || 50);
        const search = req.query.search || '';
        const stockFilter = req.query.stockFilter || 'all';
        const sortBy = req.query.sortBy || 'product_name';
        const sortOrder = req.query.sortOrder || 'asc';
        const offset = (page - 1) * limit;

        if (!warehouse) {
            return res.status(400).json({ 
                success: false, 
                message: 'Warehouse parameter is required' 
            });
        }

        let where = 'WHERE i.warehouse_code = ?';
        const params = [warehouse];

        // Search filter
        if (search) {
            where += ' AND (i.product LIKE ? OR i.code LIKE ? OR i.variant LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Stock filter
        if (stockFilter === 'in-stock') {
            where += ' AND i.stock > 10';
        } else if (stockFilter === 'low-stock') {
            where += ' AND i.stock > 0 AND i.stock <= 10';
        } else if (stockFilter === 'out-of-stock') {
            where += ' AND i.stock = 0';
        }

        // Sort mapping
        const sortMapping = {
            'product_name': 'i.product',
            'stock': 'i.stock',
            'warehouse': 'i.warehouse',
            'updated_at': 'i.updated_at'
        };
        const sortColumn = sortMapping[sortBy] || 'i.product';
        const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

        // Main query
        const dataSql = `
            SELECT 
                i.id,
                i.product,
                i.code,
                i.variant,
                i.warehouse,
                i.warehouse_code,
                i.stock,
                i.opening,
                i.created_at,
                i.updated_at,
                w.Warehouse_name,
                s.store_name,
                s.city,
                s.state
            FROM inventory i
            LEFT JOIN dispatch_warehouse w ON i.warehouse_code = w.warehouse_code
            LEFT JOIN stores s ON i.warehouse_code = s.store_code
            ${where}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;

        // Count query
        const countSql = `
            SELECT COUNT(*) AS total
            FROM inventory i
            LEFT JOIN dispatch_warehouse w ON i.warehouse_code = w.warehouse_code
            LEFT JOIN stores s ON i.warehouse_code = s.store_code
            ${where}
        `;

        // Stats query for this warehouse
        const statsSql = `
            SELECT 
                COUNT(DISTINCT i.code) as totalProducts,
                SUM(i.stock) as totalStock,
                COUNT(CASE WHEN i.stock > 0 AND i.stock <= 10 THEN 1 END) as lowStockItems,
                COUNT(CASE WHEN i.stock = 0 THEN 1 END) as outOfStockItems
            FROM inventory i
            LEFT JOIN dispatch_warehouse w ON i.warehouse_code = w.warehouse_code
            LEFT JOIN stores s ON i.warehouse_code = s.store_code
            ${where}
        `;

        // Execute queries
        db.query(dataSql, [...params, limit, offset], (err, rows) => {
            if (err) {
                console.error('getInventoryByWarehouse:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to fetch warehouse inventory' 
                });
            }

            db.query(countSql, params, (err2, countRows) => {
                if (err2) {
                    console.error('countInventoryByWarehouse:', err2);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to count warehouse inventory' 
                    });
                }

                db.query(statsSql, params, (err3, statsRows) => {
                    if (err3) {
                        console.error('statsInventoryByWarehouse:', err3);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Failed to get warehouse inventory stats' 
                        });
                    }

                    res.json({
                        success: true,
                        data: {
                            inventory: rows,
                            warehouse: warehouse,
                            pagination: {
                                page,
                                limit,
                                total: countRows[0].total,
                                pages: Math.ceil(countRows[0].total / limit)
                            },
                            stats: statsRows[0] || {
                                totalProducts: 0,
                                totalStock: 0,
                                lowStockItems: 0,
                                outOfStockItems: 0
                            }
                        }
                    });
                });
            });
        });
    }

    // ===============================
    // EXPORT INVENTORY
    // ===============================
    static exportInventory(req, res) {
        const search = req.query.search || '';
        const warehouses = req.query.warehouses || '';
        const stockFilter = req.query.stockFilter || 'all';
        const sortBy = req.query.sortBy || 'product_name';
        const sortOrder = req.query.sortOrder || 'asc';

        let where = 'WHERE 1=1';
        const params = [];

        // Search filter
        if (search) {
            where += ' AND (i.product LIKE ? OR i.code LIKE ? OR i.variant LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Warehouse filter
        if (warehouses) {
            const warehouseList = warehouses.split(',').filter(w => w.trim());
            if (warehouseList.length > 0) {
                const placeholders = warehouseList.map(() => '?').join(',');
                where += ` AND i.warehouse_code IN (${placeholders})`;
                params.push(...warehouseList);
            }
        }

        // Stock filter
        if (stockFilter === 'in-stock') {
            where += ' AND i.stock > 10';
        } else if (stockFilter === 'low-stock') {
            where += ' AND i.stock > 0 AND i.stock <= 10';
        } else if (stockFilter === 'out-of-stock') {
            where += ' AND i.stock = 0';
        }

        // Sort mapping
        const sortMapping = {
            'product_name': 'i.product',
            'stock': 'i.stock',
            'warehouse': 'i.warehouse',
            'updated_at': 'i.updated_at'
        };
        const sortColumn = sortMapping[sortBy] || 'i.product';
        const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

        const sql = `
            SELECT 
                i.product as 'Product Name',
                i.code as 'Barcode',
                i.variant as 'Variant',
                i.warehouse as 'Location',
                i.stock as 'Stock Quantity',
                CASE 
                    WHEN i.stock = 0 THEN 'Out of Stock'
                    WHEN i.stock <= 10 THEN 'Low Stock'
                    ELSE 'In Stock'
                END as 'Status',
                DATE_FORMAT(i.updated_at, '%Y-%m-%d %H:%i:%s') as 'Last Updated'
            FROM inventory i
            LEFT JOIN dispatch_warehouse w ON i.warehouse_code = w.warehouse_code
            LEFT JOIN stores s ON i.warehouse_code = s.store_code
            ${where}
            ORDER BY ${sortColumn} ${sortDirection}
        `;

        db.query(sql, params, (err, rows) => {
            if (err) {
                console.error('exportInventory:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to export inventory' 
                });
            }

            // Convert to CSV
            if (rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No data to export' 
                });
            }

            const headers = Object.keys(rows[0]);
            const csvContent = [
                headers.join(','),
                ...rows.map(row => 
                    headers.map(header => 
                        `"${(row[header] || '').toString().replace(/"/g, '""')}"`
                    ).join(',')
                )
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
        });
    }

    // ===============================
    // CATEGORIES
    // ===============================
    static getCategories(req, res) {
        db.query(
            'SELECT id, name, display_name FROM product_categories WHERE is_active = 1',
            (err, rows) => {
                if (err) {
                    console.error('getCategories:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to fetch categories' 
                    });
                }
                res.json({ success: true, data: rows });
            }
        );
    }

    static createCategory(req, res) {
        const { name, display_name, description } = req.body;

        if (!name || !display_name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category name and display name are required' 
            });
        }

        db.query(
            'INSERT INTO product_categories (name, display_name, description) VALUES (?, ?, ?)',
            [name, display_name, description || null],
            (err) => {
                if (err) {
                    console.error('createCategory:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Category name already exists' 
                        });
                    }
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to create category' 
                    });
                }
                res.json({ 
                    success: true, 
                    message: 'Category created successfully' 
                });
            }
        );
    }
}

// ===============================
// HELPER FUNCTIONS
// ===============================
function insertProducts(products, req, res) {
    if (!products || products.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'No valid products found in file' 
        });
    }

    let completed = 0;
    let successful = 0;
    let errors = [];

    products.forEach((product, index) => {
        // Validate required fields
        if (!product.product_name || !product.barcode) {
            completed++;
            errors.push(`Row ${index + 1}: Missing required fields (product_name, barcode)`);
            
            if (completed === products.length) {
                sendBulkImportResponse(res, successful, errors);
            }
            return;
        }

        const sql = `
            INSERT INTO dispatch_product 
            (product_name, product_variant, barcode, description, category_id, price, cost_price, weight, dimensions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            product.product_name,
            product.product_variant || null,
            product.barcode,
            product.description || null,
            product.category_id || null,
            product.price || null,
            product.cost_price || null,
            product.weight || null,
            product.dimensions || null
        ], (err) => {
            completed++;
            
            if (err) {
                console.error(`Error inserting product ${index + 1}:`, err);
                if (err.code === 'ER_DUP_ENTRY') {
                    errors.push(`Row ${index + 1}: Barcode '${product.barcode}' already exists`);
                } else {
                    errors.push(`Row ${index + 1}: Database error`);
                }
            } else {
                successful++;
            }

            // Send response when all products are processed
            if (completed === products.length) {
                sendBulkImportResponse(res, successful, errors);
            }
        });
    });
}

function insertProductsWithProgress(products, req, res) {
    if (!products || products.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'No valid products found in file' 
        });
    }

    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const totalProducts = products.length;
    let completed = 0;
    let successful = 0;
    let errors = [];

    // Send initial progress
    res.write(`data: ${JSON.stringify({
        type: 'start',
        total: totalProducts,
        current: 0,
        message: 'Starting product import...'
    })}\n\n`);

    // Process products sequentially for better progress tracking
    const processProduct = async (index) => {
        if (index >= products.length) {
            // Send completion
            res.write(`data: ${JSON.stringify({
                type: 'complete',
                total: totalProducts,
                successful: successful,
                failed: errors.length,
                successCount: successful,
                errorDetails: errors,
                message: `Import complete! ${successful} products imported, ${errors.length} failed`
            })}\n\n`);
            res.end();
            return;
        }

        const product = products[index];
        const rowNumber = index + 1;

        // Send progress update
        res.write(`data: ${JSON.stringify({
            type: 'progress',
            total: totalProducts,
            current: rowNumber,
            percentage: Math.round((rowNumber / totalProducts) * 100),
            message: `Processing ${product.product_name || 'Unknown Product'}...`,
            product_name: product.product_name,
            barcode: product.barcode
        })}\n\n`);

        // Validate required fields
        if (!product.product_name || !product.barcode) {
            errors.push(`Row ${rowNumber}: Missing required fields (product_name, barcode)`);
            
            // Send error update
            res.write(`data: ${JSON.stringify({
                type: 'error',
                row: rowNumber,
                message: 'Validation failed for row ' + rowNumber
            })}\n\n`);
            
            completed++;
            // Add small delay and continue to next product
            setTimeout(() => processProduct(index + 1), 50);
            return;
        }

        // Look up category_id from category_name if provided
        const lookupCategoryAndInsert = () => {
            if (product.category_name && product.category_name.trim()) {
                const categoryName = product.category_name.trim();
                
                // Look up category by name (case-insensitive)
                const categorySql = 'SELECT id FROM product_categories WHERE LOWER(name) = LOWER(?) OR LOWER(display_name) = LOWER(?) LIMIT 1';
                db.query(categorySql, [categoryName, categoryName], (catErr, catResults) => {
                    if (catErr) {
                        console.warn(`Category lookup warning for row ${rowNumber}:`, catErr.message);
                        insertProduct(null);
                        return;
                    }
                    
                    if (catResults && catResults.length > 0) {
                        // Category exists, use it
                        insertProduct(catResults[0].id);
                    } else {
                        // Category doesn't exist, create it automatically
                        const createCategorySql = `
                            INSERT INTO product_categories (name, display_name, is_active)
                            VALUES (?, ?, 1)
                        `;
                        
                        // Create slug-friendly name (lowercase, replace spaces with hyphens)
                        const slugName = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        
                        db.query(createCategorySql, [slugName, categoryName], (createErr, createResult) => {
                            if (createErr) {
                                console.warn(`Failed to auto-create category '${categoryName}' for row ${rowNumber}:`, createErr.message);
                                // Insert product without category
                                insertProduct(null);
                            } else {
                                console.log(`✅ Auto-created category: ${categoryName} (ID: ${createResult.insertId})`);
                                // Insert product with newly created category
                                insertProduct(createResult.insertId);
                            }
                        });
                    }
                });
            } else if (product.category_id) {
                // Fallback: use category_id if provided directly
                insertProduct(product.category_id);
            } else {
                // No category specified
                insertProduct(null);
            }
        };

        const insertProduct = (categoryId) => {
            const sql = `
                INSERT INTO dispatch_product 
                (product_name, product_variant, barcode, description, category_id, price, cost_price, weight, dimensions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(sql, [
                product.product_name,
                product.product_variant || null,
                product.barcode,
                product.description || null,
                categoryId,
                product.price || null,
                product.cost_price || null,
                product.weight || null,
                product.dimensions || null
            ], (err) => {
                completed++;
                
                if (err) {
                    console.error(`Error inserting product ${rowNumber}:`, err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        errors.push(`Row ${rowNumber}: Barcode '${product.barcode}' already exists`);
                    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                        errors.push(`Row ${rowNumber}: Invalid category`);
                    } else {
                        errors.push(`Row ${rowNumber}: Database error - ${err.message}`);
                    }

                    // Send error update
                    res.write(`data: ${JSON.stringify({
                        type: 'error',
                        row: rowNumber,
                        message: `Failed to insert row ${rowNumber}: ${err.code === 'ER_DUP_ENTRY' ? 'Duplicate barcode' : err.code === 'ER_NO_REFERENCED_ROW_2' ? 'Invalid category' : 'Database error'}`
                    })}\n\n`);
                } else {
                    successful++;

                    // Send success update
                    res.write(`data: ${JSON.stringify({
                        type: 'success',
                        row: rowNumber,
                        message: `Successfully inserted ${product.product_name}`
                    })}\n\n`);
                }

                // Add small delay and continue to next product
                setTimeout(() => processProduct(index + 1), 50);
            });
        };

        // Start the category lookup and insert process
        lookupCategoryAndInsert();
    };

    // Start processing
    processProduct(0);
}

function sendBulkImportResponse(res, successful, errors) {
    const hasErrors = errors.length > 0;
    
    res.json({
        success: true,
        message: `Import completed. ${successful} products imported successfully${hasErrors ? `, ${errors.length} errors` : ''}.`,
        count: successful,
        data: {
            successful,
            errors: errors.length,
            errorDetails: errors
        }
    });
}

function sendBulkTransferResponse(res, successful, errors, locationName) {
    const hasErrors = errors.length > 0;
    
    res.json({
        success: true,
        message: `Bulk transfer completed. ${successful} products transferred to ${locationName}${hasErrors ? `, ${errors.length} errors` : ''}.`,
        count: successful,
        data: {
            successful,
            errors: errors.length,
            errorDetails: errors,
            location: locationName
        }
    });
}

module.exports = ProductController;
