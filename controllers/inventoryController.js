const db = require('../db/connection');

/**
 * =====================================================
 * ADD STOCK (OPENING / PURCHASE / RETURN)
 * =====================================================
 */
exports.addStock = (req, res) => {
    const {
        product_name,
        barcode,
        variant,
        warehouse,
        qty,
        unit_cost = 0,
        source_type = 'OPENING'
    } = req.body;

    if (!product_name || !barcode || !warehouse || !qty) {
        return res.status(400).json({
            success: false,
            message: 'product_name, barcode, warehouse, qty are required'
        });
    }

    const quantity = Number(qty);
    if (quantity <= 0) {
        return res.status(400).json({
            success: false,
            message: 'qty must be greater than 0'
        });
    }

    const reference = `${source_type}_${barcode}_${Date.now()}`;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: err.message });

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
            ) VALUES (NOW(), ?, ?, ?, ?, ?, 'IN', ?)
        `;

        db.query(ledgerSql, [
            source_type, barcode, product_name, warehouse, quantity, reference
        ], err => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.sqlMessage })
                );
            }

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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `;

            db.query(batchSql, [
                product_name,
                barcode,
                variant || null,
                warehouse,
                source_type,
                quantity,
                quantity,
                unit_cost
            ], err => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, error: err.sqlMessage })
                    );
                }

                db.commit(err => {
                    if (err) {
                        return db.rollback(() =>
                            res.status(500).json({ success: false, message: err.message })
                        );
                    }

                    // Log INVENTORY_ADD audit using PermissionsController
                    if (req.user) {
                        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                                         req.headers['x-real-ip'] ||
                                         req.connection.remoteAddress ||
                                         req.ip ||
                                         '127.0.0.1';
                        
                        const PermissionsController = require('../controllers/permissionsController');
                        PermissionsController.createAuditLog(req.user.id, 'CREATE', 'INVENTORY', null, {
                            user_name: req.user.name || 'Unknown',
                            user_email: req.user.email || 'Unknown',
                            product_name,
                            barcode,
                            variant,
                            warehouse,
                            quantity,
                            unit_cost,
                            source_type,
                            reference,
                            create_time: new Date().toISOString(),
                            ip_address: ipAddress,
                            user_agent: req.get('User-Agent') || 'Unknown'
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Stock added successfully',
                        reference
                    });
                });
            });
        });
    });
};

/**
 * =====================================================
 * GET INVENTORY (PAGINATION + DATE FILTER)
 * =====================================================
 */
exports.getInventory = async (req, res) => {
    const {
        warehouse,
        page = 1,
        limit = 20,
        dateFrom,
        dateTo,
        search,
        stockFilter,
        sortBy = 'product_name',
        sortOrder = 'asc'
    } = req.query;

    console.log('📦 Inventory API called with filters:', req.query);

    const filters = [`sb.status = 'active'`];
    const values = [];

    // Get user permissions from database
    const getUserPermissionsQuery = `
        SELECT DISTINCT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
    `;

    try {
        const userPermissions = await new Promise((resolve, reject) => {
            db.query(getUserPermissionsQuery, [req.user.role_id], (err, results) => {
                if (err) reject(err);
                else resolve(results.map(r => r.name));
            });
        });

        console.log('🔐 User permissions:', userPermissions);

        const hasGlobalInventoryView = userPermissions.includes('INVENTORY_VIEW') || userPermissions.includes('SYSTEM_USER_MANAGEMENT');
        
        if (!hasGlobalInventoryView) {
            // User doesn't have global inventory view, check warehouse-specific permissions
            const accessibleWarehouses = [];
            const warehouseCodes = ['GGM_WH', 'BLR_WH', 'MUM_WH', 'AMD_WH', 'HYD_WH'];
            
            warehouseCodes.forEach(whCode => {
                if (userPermissions.includes(`INVENTORY_VIEW_${whCode}`)) {
                    accessibleWarehouses.push(whCode);
                }
            });
            
            if (accessibleWarehouses.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'No warehouse access permissions. Please contact administrator.',
                    user_role: req.user.role_name,
                    required_permissions: 'INVENTORY_VIEW or INVENTORY_VIEW_<WAREHOUSE>'
                });
            }
            
            // Filter by accessible warehouses
            filters.push(`sb.warehouse IN (${accessibleWarehouses.map(() => '?').join(',')})`);
            values.push(...accessibleWarehouses);
            console.log('🔐 User has access to warehouses:', accessibleWarehouses);
        }

        // Warehouse filter (additional filter if specified)
        if (warehouse) {
            // Check if user has permission for this specific warehouse
            if (!hasGlobalInventoryView && !userPermissions.includes(`INVENTORY_VIEW_${warehouse}`)) {
                return res.status(403).json({
                    success: false,
                    message: `No access to warehouse: ${warehouse}`,
                    user_role: req.user.role_name
                });
            }
            
            filters.push('sb.warehouse = ?');
            values.push(warehouse);
            console.log('🏢 Filtering by warehouse:', warehouse);
        }
    } catch (permErr) {
        console.error('❌ Permission check error:', permErr);
        return res.status(500).json({
            success: false,
            message: 'Failed to check permissions'
        });
    }

    // Date filters
    if (dateFrom) {
        filters.push('sb.created_at >= ?');
        values.push(`${dateFrom} 00:00:00`);
        console.log('📅 Date from:', dateFrom);
    }

    if (dateTo) {
        filters.push('sb.created_at <= ?');
        values.push(`${dateTo} 23:59:59`);
        console.log('📅 Date to:', dateTo);
    }

    // Search filter
    if (search) {
        filters.push('(sb.product_name LIKE ? OR sb.barcode LIKE ? OR sb.variant LIKE ?)');
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm);
        console.log('🔍 Search term:', search);
    }

    const offset = (page - 1) * limit;

    // Base SQL for grouped results with damage count (using subquery to avoid row multiplication)
    let sql = `
        SELECT
            sb.barcode,
            sb.product_name,
            sb.variant,
            sb.warehouse,
            SUM(sb.qty_available) AS stock,
            MAX(sb.created_at) AS updated_at,
            COALESCE(
                (SELECT SUM(quantity) 
                 FROM damage_recovery_log 
                 WHERE barcode = sb.barcode 
                   AND inventory_location = sb.warehouse 
                   AND action_type = 'damage'), 
                0
            ) AS damage_count
        FROM stock_batches sb
        WHERE ${filters.join(' AND ')}
        GROUP BY sb.barcode, sb.product_name, sb.variant, sb.warehouse
    `;

    // Stock filter (applied after GROUP BY)
    if (stockFilter && stockFilter !== 'all') {
        switch (stockFilter) {
            case 'in-stock':
                sql += ' HAVING SUM(qty_available) > 10';
                break;
            case 'low-stock':
                sql += ' HAVING SUM(qty_available) > 0 AND SUM(qty_available) <= 10';
                break;
            case 'out-of-stock':
                sql += ' HAVING SUM(qty_available) = 0';
                break;
        }
    }

    // Sorting
    const validSortFields = ['product_name', 'stock', 'warehouse', 'updated_at'];
    const validSortOrders = ['asc', 'desc'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
        const sortColumn = sortBy === 'stock' ? 'SUM(qty_available)' : sortBy;
        sql += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
    } else {
        sql += ' ORDER BY product_name ASC';
    }

    // Pagination
    sql += ' LIMIT ? OFFSET ?';
    values.push(Number(limit), Number(offset));

    console.log('🔍 Final SQL:', sql);
    console.log('🔍 Values:', values);

    db.query(sql, values, (err, rows) => {
        if (err) {
            console.error('❌ Inventory query error:', err);
            return res.status(500).json({ success: false, error: err.sqlMessage });
        }

        // ── Get total count (without LIMIT) for pagination ──
        const countSql = sql.replace(/SELECT.*?FROM/s, 'SELECT COUNT(*) as cnt FROM').replace(/ORDER BY.*$/s, '').replace(/LIMIT.*$/s, '');
        const countValues = values.slice(0, -2); // remove limit + offset

        // Build a clean count query
        const baseCountSql = `
            SELECT COUNT(*) as cnt
            FROM (
                SELECT sb.barcode
                FROM stock_batches sb
                WHERE ${filters.join(' AND ')}
                GROUP BY sb.barcode, sb.product_name, sb.variant, sb.warehouse
                ${stockFilter === 'in-stock' ? 'HAVING SUM(sb.qty_available) > 10' :
                  stockFilter === 'low-stock' ? 'HAVING SUM(sb.qty_available) > 0 AND SUM(sb.qty_available) <= 10' :
                  stockFilter === 'out-of-stock' ? 'HAVING SUM(sb.qty_available) = 0' : ''}
            ) as counted
        `;

        db.query(baseCountSql, countValues, (countErr, countRows) => {
            const totalCount = countErr ? rows.length : (countRows[0]?.cnt || rows.length);

            const totalStock = rows.reduce((sum, item) => sum + parseInt(item.stock || 0), 0);
            const lowStockItems = rows.filter(item => parseInt(item.stock || 0) > 0 && parseInt(item.stock || 0) <= 10).length;
            const outOfStockItems = rows.filter(item => parseInt(item.stock || 0) === 0).length;

            res.json({
                success: true,
                data: rows,
                total: totalCount,
                stats: { totalProducts: totalCount, totalStock, lowStockItems, outOfStockItems },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalCount / limit)
                }
            });
        });
    });
};

/**
 * =====================================================
 * GET INVENTORY BY WAREHOUSE (DATE FILTER ADDED)
 * =====================================================
 */
exports.getInventoryByWarehouse = (req, res) => {
    const { warehouse, dateFrom, dateTo } = req.query;

    if (!warehouse) {
        return res.status(400).json({
            success: false,
            message: 'warehouse is required'
        });
    }

    const filters = ['warehouse = ?', "status = 'active'"];
    const values = [warehouse];

    if (dateFrom) {
        filters.push('created_at >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('created_at <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    const sql = `
        SELECT
            barcode,
            product_name AS product,
            warehouse,
            SUM(qty_available) AS stock,
            MAX(created_at) AS updated_at
        FROM stock_batches
        WHERE ${filters.join(' AND ')}
        GROUP BY barcode, product_name, warehouse
        ORDER BY product_name
    `;

    db.query(sql, values, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.sqlMessage
            });
        }

        res.json(rows);
    });
};

/**
 * =====================================================
 * EXPORT INVENTORY
 * =====================================================
 */
exports.exportInventory = (req, res) => {
    const {
        warehouse,
        warehouses, // Handle multiple warehouses
        dateFrom,
        dateTo,
        search,
        stockFilter
    } = req.query;

    const filters = [`status = 'active'`];
    const values = [];

    // Handle both single warehouse and multiple warehouses
    if (warehouses) {
        // Multiple warehouses (comma-separated)
        const warehouseList = warehouses.split(',').map(w => w.trim()).filter(w => w);
        if (warehouseList.length > 0) {
            const placeholders = warehouseList.map(() => '?').join(',');
            filters.push(`warehouse IN (${placeholders})`);
            values.push(...warehouseList);
        }
    } else if (warehouse) {
        // Single warehouse
        filters.push('warehouse = ?');
        values.push(warehouse);
    }

    if (dateFrom) {
        filters.push('created_at >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('created_at <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    if (search) {
        filters.push('(product_name LIKE ? OR barcode LIKE ? OR variant LIKE ?)');
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm);
    }

    let sql = `
        SELECT
            barcode,
            product_name,
            variant,
            warehouse,
            SUM(qty_available) AS stock,
            MAX(created_at) AS updated_at
        FROM stock_batches
        WHERE ${filters.join(' AND ')}
        GROUP BY barcode, product_name, variant, warehouse
    `;

    if (stockFilter && stockFilter !== 'all') {
        switch (stockFilter) {
            case 'in-stock':
                sql += ' HAVING SUM(qty_available) > 10';
                break;
            case 'low-stock':
                sql += ' HAVING SUM(qty_available) > 0 AND SUM(qty_available) <= 10';
                break;
            case 'out-of-stock':
                sql += ' HAVING SUM(qty_available) = 0';
                break;
        }
    }

    sql += ' ORDER BY product_name ASC';

    db.query(sql, values, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.sqlMessage
            });
        }

        // Generate CSV
        const csvHeader = 'Product Name,Barcode,Variant,Warehouse,Stock,Last Updated\n';
        const csvRows = rows.map(item => 
            `"${item.product_name}","${item.barcode}","${item.variant || ''}","${item.warehouse}",${item.stock},"${item.updated_at}"`
        ).join('\n');
        
        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="inventory-${warehouse || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    });
};


