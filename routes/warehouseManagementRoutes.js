const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

/**
 * WAREHOUSE MANAGEMENT ROUTES
 * For registering and managing warehouses and stores
 */

// GET /api/warehouse-management/warehouses - Get all warehouses
router.get('/warehouses', authenticateToken, (req, res) => {
    try {
        // Get warehouses from the warehouses table
        const sql = `
            SELECT 
                id,
                code as warehouse_code,
                name as warehouse_name,
                location,
                address,
                city,
                state,
                country,
                pincode,
                phone,
                email,
                manager_name,
                capacity,
                is_active,
                created_at,
                updated_at
            FROM warehouses
            WHERE is_active = TRUE OR is_active IS NULL
            ORDER BY name ASC
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error('❌ Error fetching warehouses:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch warehouses',
                    error: err.message
                });
            }

            console.log(`✅ Fetched ${results.length} warehouses from warehouses table`);
            if (results.length > 0) {
                console.log('   Sample:', results[0].warehouse_name, `(${results[0].warehouse_code})`);
            }

            res.json({
                success: true,
                warehouses: results
            });
        });
    } catch (error) {
        console.error('❌ Warehouse API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// POST /api/warehouse-management/warehouses - Create new warehouse
router.post('/warehouses', authenticateToken, (req, res) => {
    try {
        const {
            warehouse_code,
            warehouse_name,
            location,
            address,
            city,
            state,
            country = 'India',
            pincode,
            phone,
            email,
            manager_name,
            capacity = 0
        } = req.body;

        // Validate required fields
        if (!warehouse_code || !warehouse_name || !city || !state) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: warehouse_code, warehouse_name, city, state'
            });
        }

        // Check if warehouse code already exists
        const checkSql = 'SELECT id FROM warehouses WHERE code = ?';
        db.query(checkSql, [warehouse_code], (err, results) => {
            if (err) {
                console.error('Error checking warehouse code:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Warehouse code already exists'
                });
            }

            // Insert new warehouse
            const insertSql = `
                INSERT INTO warehouses (
                    code, name, location, address, city, state, country,
                    pincode, phone, email, manager_name, capacity
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(insertSql, [
                warehouse_code, warehouse_name, location, address, city, state, country,
                pincode, phone, email, manager_name, capacity
            ], (err, result) => {
                if (err) {
                    console.error('Error creating warehouse:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create warehouse',
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    message: 'Warehouse created successfully',
                    warehouse_id: result.insertId
                });
            });
        });
    } catch (error) {
        console.error('Warehouse creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/warehouse-management/stores - Get all stores
router.get('/stores', authenticateToken, (req, res) => {
    try {
        const sql = `
            SELECT 
                id,
                store_code,
                store_name,
                'retail' as store_type,
                address,
                city,
                state,
                country,
                pincode,
                phone,
                email,
                manager_name,
                area_sqft,
                is_active,
                created_at,
                updated_at
            FROM stores 
            WHERE is_active = TRUE
            ORDER BY store_name ASC
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching stores:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch stores',
                    error: err.message
                });
            }

            res.json({
                success: true,
                stores: results
            });
        });
    } catch (error) {
        console.error('Stores API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/warehouse-management/logistics - Get logistics partners
router.get('/logistics', authenticateToken, (req, res) => {
    const sql = `
        SELECT id, name
        FROM logistics
        ORDER BY name ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching logistics:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch logistics',
                error: err.message
            });
        }

        res.json({
            success: true,
            logistics: results
        });
    });
});

// POST /api/warehouse-management/logistics - Create logistics partner
router.post('/logistics', authenticateToken, (req, res) => {
    const { name } = req.body;
    const cleanName = String(name || '').trim();

    if (!cleanName) {
        return res.status(400).json({
            success: false,
            message: 'Logistics name is required'
        });
    }

    db.query('SELECT id FROM logistics WHERE LOWER(name) = LOWER(?)', [cleanName], (err, existing) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Logistics partner already exists' });
        }

        db.query('INSERT INTO logistics (name) VALUES (?)', [cleanName], (insertErr, result) => {
            if (insertErr) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create logistics partner',
                    error: insertErr.message
                });
            }

            res.json({
                success: true,
                message: 'Logistics partner created successfully',
                logistics_id: result.insertId
            });
        });
    });
});

// PUT /api/warehouse-management/logistics/:id - Update logistics partner
router.put('/logistics/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const cleanName = String(name || '').trim();

    if (!cleanName) {
        return res.status(400).json({
            success: false,
            message: 'Logistics name is required'
        });
    }

    db.query(
        'UPDATE logistics SET name = ? WHERE id = ?',
        [cleanName, id],
        (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update logistics partner',
                    error: err.message
                });
            }

            res.json({ success: true, message: 'Logistics partner updated successfully' });
        }
    );
});

// DELETE /api/warehouse-management/logistics/:id - Delete logistics partner
router.delete('/logistics/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM logistics WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete logistics partner',
                error: err.message
            });
        }

        res.json({ success: true, message: 'Logistics partner deleted successfully' });
    });
});

// GET /api/warehouse-management/processed-by - Get warehouse/store processing users
router.get('/processed-by', authenticateToken, (req, res) => {
    const sql = `
        SELECT id, warehouse as location_code, name
        FROM warehousestaff_processed
        ORDER BY warehouse ASC, name ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching processed-by users:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch processed-by users',
                error: err.message
            });
        }

        res.json({
            success: true,
            processedBy: results
        });
    });
});

// POST /api/warehouse-management/processed-by - Create processing user
router.post('/processed-by', authenticateToken, (req, res) => {
    const locationCode = String(req.body.location_code || req.body.warehouse || '').trim();
    const name = String(req.body.name || '').trim();

    if (!locationCode || !name) {
        return res.status(400).json({
            success: false,
            message: 'Location and name are required'
        });
    }

    const checkSql = `
        SELECT id
        FROM warehousestaff_processed
        WHERE LOWER(warehouse) = LOWER(?) AND LOWER(name) = LOWER(?)
    `;

    db.query(checkSql, [locationCode, name], (err, existing) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Processed-by user already exists for this location' });
        }

        db.query(
            'INSERT INTO warehousestaff_processed (warehouse, name) VALUES (?, ?)',
            [locationCode, name],
            (insertErr, result) => {
                if (insertErr) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create processed-by user',
                        error: insertErr.message
                    });
                }

                res.json({
                    success: true,
                    message: 'Processed-by user created successfully',
                    processed_by_id: result.insertId
                });
            }
        );
    });
});

// PUT /api/warehouse-management/processed-by/:id - Update processing user
router.put('/processed-by/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const locationCode = String(req.body.location_code || req.body.warehouse || '').trim();
    const name = String(req.body.name || '').trim();

    if (!locationCode || !name) {
        return res.status(400).json({
            success: false,
            message: 'Location and name are required'
        });
    }

    db.query(
        'UPDATE warehousestaff_processed SET warehouse = ?, name = ? WHERE id = ?',
        [locationCode, name, id],
        (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update processed-by user',
                    error: err.message
                });
            }

            res.json({ success: true, message: 'Processed-by user updated successfully' });
        }
    );
});

// DELETE /api/warehouse-management/processed-by/:id - Delete processing user
router.delete('/processed-by/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM warehousestaff_processed WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete processed-by user',
                error: err.message
            });
        }

        res.json({ success: true, message: 'Processed-by user deleted successfully' });
    });
});

// POST /api/warehouse-management/stores - Create new store
router.post('/stores', authenticateToken, (req, res) => {
    try {
        const {
            store_code,
            store_name,
            store_type = 'retail',
            address,
            city,
            state,
            country = 'India',
            pincode,
            phone,
            email,
            manager_name,
            area_sqft = 0
        } = req.body;

        // Validate required fields
        if (!store_code || !store_name || !address || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: store_code, store_name, address, city, state, pincode'
            });
        }

        // Check if store code already exists
        const checkSql = 'SELECT id FROM stores WHERE store_code = ?';
        db.query(checkSql, [store_code], (err, results) => {
            if (err) {
                console.error('Error checking store code:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Store code already exists'
                });
            }

            // Insert new store
            const insertSql = `
                INSERT INTO stores (
                    store_code, store_name, store_type, address, city, state, country,
                    pincode, phone, email, manager_name, area_sqft
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(insertSql, [
                store_code, store_name, store_type, address, city, state, country,
                pincode, phone, email, manager_name, area_sqft
            ], (err, result) => {
                if (err) {
                    console.error('Error creating store:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create store',
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    message: 'Store created successfully',
                    store_id: result.insertId
                });
            });
        });
    } catch (error) {
        console.error('Store creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// PUT /api/warehouse-management/warehouses/:id - Update warehouse
router.put('/warehouses/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const {
            warehouse_name,
            location,
            address,
            city,
            state,
            country = 'India',
            pincode,
            phone,
            email,
            manager_name,
            capacity = 0
        } = req.body;

        if (!warehouse_name || !city || !state) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const updateSql = `
            UPDATE warehouses SET
                name = ?, location = ?, address = ?, city = ?, state = ?, country = ?,
                pincode = ?, phone = ?, email = ?, manager_name = ?, capacity = ?,
                updated_at = NOW()
            WHERE id = ?
        `;

        db.query(updateSql, [
            warehouse_name, location, address, city, state, country,
            pincode, phone, email, manager_name, capacity, id
        ], (err, result) => {
            if (err) {
                console.error('Error updating warehouse:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update warehouse',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Warehouse updated successfully'
            });
        });
    } catch (error) {
        console.error('Warehouse update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// DELETE /api/warehouse-management/warehouses/:id - Delete warehouse
router.delete('/warehouses/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const deleteSql = 'UPDATE warehouses SET is_active = FALSE WHERE id = ?';

        db.query(deleteSql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting warehouse:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete warehouse',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Warehouse deleted successfully'
            });
        });
    } catch (error) {
        console.error('Warehouse deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// PUT /api/warehouse-management/stores/:id - Update store
router.put('/stores/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const {
            store_name,
            store_type = 'retail',
            address,
            city,
            state,
            country = 'India',
            pincode,
            phone,
            email,
            manager_name,
            area_sqft = 0
        } = req.body;

        if (!store_name || !address || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const updateSql = `
            UPDATE stores SET
                store_name = ?, store_type = ?, address = ?, city = ?, state = ?, country = ?,
                pincode = ?, phone = ?, email = ?, manager_name = ?, area_sqft = ?,
                updated_at = NOW()
            WHERE id = ?
        `;

        db.query(updateSql, [
            store_name, store_type, address, city, state, country,
            pincode, phone, email, manager_name, area_sqft, id
        ], (err, result) => {
            if (err) {
                console.error('Error updating store:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update store',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Store updated successfully'
            });
        });
    } catch (error) {
        console.error('Store update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// DELETE /api/warehouse-management/stores/:id - Delete store
router.delete('/stores/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const deleteSql = 'UPDATE stores SET is_active = FALSE WHERE id = ?';

        db.query(deleteSql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting store:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete store',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Store deleted successfully'
            });
        });
    } catch (error) {
        console.error('Store deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
