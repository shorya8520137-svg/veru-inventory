const db = require('../db/connection');

/**
 * =====================================================
 * INVENTORY MOVEMENT RECORDS CONTROLLER - FIXED
 * Handles fetching and displaying all inventory movements
 * (returns, damage, recovery, adjustments)
 * =====================================================
 */

/**
 * GET INVENTORY MOVEMENT RECORDS
 * Combines data from multiple tables to show all inventory movements
 */
const getMovementRecords = (req, res) => {
    const {
        movement_type = 'all',
        warehouse,
        search,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
        export: isExport = false
    } = req.query;

    console.log('📦 Movement records request:', req.query);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const filters = [];
    const values = [];

    // Build the unified query to get all movement records
    let baseQuery = `
        SELECT 
            'damage' as movement_type,
            id,
            product_type as product_name,
            barcode,
            inventory_location as warehouse,
            quantity as qty,
            'OUT' as direction,
            NULL as order_ref,
            NULL as awb,
            CONCAT('DMG-', id) as reference,
            timestamp as event_time,
            'damage' as source_table
        FROM damage_recovery_log 
        WHERE action_type = 'damage'
        
        UNION ALL
        
        SELECT 
            'recover' as movement_type,
            id,
            product_type as product_name,
            barcode,
            inventory_location as warehouse,
            quantity as qty,
            'IN' as direction,
            NULL as order_ref,
            NULL as awb,
            CONCAT('REC-', id) as reference,
            timestamp as event_time,
            'recovery' as source_table
        FROM damage_recovery_log 
        WHERE action_type = 'recover'
        
        UNION ALL
        
        SELECT 
            'return' as movement_type,
            id,
            product_type as product_name,
            barcode,
            inventory as warehouse,
            quantity as qty,
            'IN' as direction,
            order_ref,
            awb,
            COALESCE(order_ref, awb, CONCAT('RET-', id)) as reference,
            submitted_at as event_time,
            'returns' as source_table
        FROM returns
        
        UNION ALL
        
        SELECT 
            LOWER(movement_type) as movement_type,
            id,
            product_name,
            barcode,
            location_code as warehouse,
            qty,
            direction,
            NULL as order_ref,
            NULL as awb,
            reference,
            event_time,
            'ledger' as source_table
        FROM inventory_ledger_base
        WHERE movement_type IN ('DAMAGE', 'RECOVERY', 'RETURN')
    `;

    // Apply filters
    let whereConditions = [];
    
    if (movement_type !== 'all') {
        if (movement_type === 'damage') {
            whereConditions.push("movement_type = 'damage'");
        } else if (movement_type === 'recover') {
            whereConditions.push("movement_type = 'recover'");
        } else if (movement_type === 'return') {
            whereConditions.push("movement_type = 'return'");
        }
    }

    if (warehouse) {
        whereConditions.push("warehouse = ?");
        values.push(warehouse);
    }

    if (search) {
        whereConditions.push("(product_name LIKE ? OR barcode LIKE ? OR order_ref LIKE ? OR awb LIKE ?)");
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (dateFrom) {
        whereConditions.push("DATE(event_time) >= ?");
        values.push(dateFrom);
    }

    if (dateTo) {
        whereConditions.push("DATE(event_time) <= ?");
        values.push(dateTo);
    }

    // Wrap the union query and apply filters
    let finalQuery = `
        SELECT * FROM (${baseQuery}) as combined_movements
    `;

    if (whereConditions.length > 0) {
        finalQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    finalQuery += ` ORDER BY event_time DESC`;

    // Add pagination for non-export requests
    if (!isExport) {
        finalQuery += ` LIMIT ? OFFSET ?`;
        values.push(parseInt(limit), offset);
    }

    console.log('🔍 Final query:', finalQuery);
    console.log('🔍 Values:', values);

    // Execute the main query
    db.query(finalQuery, values, (err, records) => {
        if (err) {
            console.error('❌ Error fetching movement records:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch movement records',
                error: err.message
            });
        }

        // If export is requested, return CSV
        if (isExport) {
            const csv = convertToCSV(records);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=inventory-movement-records.csv');
            return res.send(csv);
        }

        // Get total count for pagination (without LIMIT)
        let countQuery = `
            SELECT COUNT(*) as total FROM (${baseQuery}) as combined_movements
        `;
        
        const countValues = [...values];
        if (whereConditions.length > 0) {
            countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
            // Remove the LIMIT and OFFSET values from countValues
            countValues.splice(-2);
        }

        db.query(countQuery, countValues, (err, countResult) => {
            if (err) {
                console.error('❌ Error getting count:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get record count',
                    error: err.message
                });
            }

            const total = countResult[0]?.total || 0;

            // Get stats
            getMovementStats((statsErr, stats) => {
                if (statsErr) {
                    console.error('❌ Error getting stats:', statsErr);
                }

                console.log('✅ Successfully fetched movement records:', {
                    count: records.length,
                    total: total,
                    page: page,
                    limit: limit
                });

                res.json({
                    success: true,
                    data: records,
                    total: total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    stats: stats || {
                        totalMovements: total,
                        damageCount: 0,
                        recoveryCount: 0,
                        returnCount: 0
                    }
                });
            });
        });
    });
};

/**
 * GET MOVEMENT STATISTICS
 */
const getMovementStats = (callback) => {
    const statsQuery = `
        SELECT 
            COUNT(*) as totalMovements,
            SUM(CASE WHEN movement_type = 'damage' THEN 1 ELSE 0 END) as damageCount,
            SUM(CASE WHEN movement_type = 'recover' THEN 1 ELSE 0 END) as recoveryCount,
            SUM(CASE WHEN movement_type = 'return' THEN 1 ELSE 0 END) as returnCount
        FROM (
            SELECT 'damage' as movement_type FROM damage_recovery_log WHERE action_type = 'damage'
            UNION ALL
            SELECT 'recover' as movement_type FROM damage_recovery_log WHERE action_type = 'recover'
            UNION ALL
            SELECT 'return' as movement_type FROM returns
            UNION ALL
            SELECT 'adjustment' as movement_type FROM inventory_ledger_base 
            WHERE movement_type IN ('DAMAGE', 'RECOVERY', 'RETURN')
        ) as all_movements
    `;

    db.query(statsQuery, (err, result) => {
        if (err) {
            return callback(err, null);
        }

        const stats = result[0] || {
            totalMovements: 0,
            damageCount: 0,
            recoveryCount: 0,
            returnCount: 0
        };

        callback(null, stats);
    });
};

/**
 * CONVERT RECORDS TO CSV FORMAT
 */
const convertToCSV = (records) => {
    if (records.length === 0) {
        return 'No data available';
    }

    const headers = [
        'Date & Time',
        'Movement Type',
        'Product Name',
        'Barcode',
        'Warehouse',
        'Quantity',
        'Direction',
        'Order Reference',
        'AWB',
        'Reference',
        'Source'
    ];

    const csvRows = [headers.join(',')];

    records.forEach(record => {
        const row = [
            record.event_time ? new Date(record.event_time).toLocaleString() : '',
            record.movement_type || '',
            `"${(record.product_name || '').replace(/"/g, '""')}"`,
            record.barcode || '',
            record.warehouse || '',
            record.qty || 0,
            record.direction || '',
            record.order_ref || '',
            record.awb || '',
            record.reference || '',
            record.source_table || ''
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
};

module.exports = {
    getMovementRecords: getMovementRecords
};