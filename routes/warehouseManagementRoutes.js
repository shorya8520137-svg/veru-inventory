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
            WHERE is_active = TRUE
            ORDER BY name ASC
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching warehouses:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch warehouses',
                    error: err.message
                });
            }

            res.json({
                success: true,
                warehouses: results
            });
        });
    } catch (error) {
        console.error('Warehouse API Error:', error);
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
                store_type,
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


module.exports = router;

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
