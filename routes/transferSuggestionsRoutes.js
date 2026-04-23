const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

/**
 * TRANSFER SUGGESTIONS ROUTES
 * Provides smart suggestions for source and destination based on transfer type
 */

// GET /api/transfer-suggestions/:transferType
// Returns source and destination options based on transfer type
router.get('/:transferType', authenticateToken, (req, res) => {
    try {
        const { transferType } = req.params;

        // Validate transfer type
        const validTypes = ['warehouse-to-warehouse', 'warehouse-to-store', 'store-to-warehouse', 'store-to-store'];
        if (!validTypes.includes(transferType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transfer type. Must be one of: ' + validTypes.join(', ')
            });
        }

        // Determine source and destination types
        let sourceType, destinationType;

        switch (transferType) {
            case 'warehouse-to-warehouse':
                sourceType = 'warehouse';
                destinationType = 'warehouse';
                break;
            case 'warehouse-to-store':
                sourceType = 'warehouse';
                destinationType = 'store';
                break;
            case 'store-to-warehouse':
                sourceType = 'store';
                destinationType = 'warehouse';
                break;
            case 'store-to-store':
                sourceType = 'store';
                destinationType = 'store';
                break;
        }

        // Fetch source options
        const sourceOptions = sourceType === 'warehouse' 
            ? getWarehouses() 
            : getStores();

        // Fetch destination options
        const destinationOptions = destinationType === 'warehouse' 
            ? getWarehouses() 
            : getStores();

        Promise.all([sourceOptions, destinationOptions])
            .then(([sources, destinations]) => {
                res.json({
                    success: true,
                    transferType: transferType,
                    sourceType: sourceType,
                    destinationType: destinationType,
                    sources: sources,
                    destinations: destinations
                });
            })
            .catch(error => {
                console.error('Error fetching suggestions:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch suggestions',
                    error: error.message
                });
            });

    } catch (error) {
        console.error('Transfer suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Helper function to get warehouses
function getWarehouses() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                id,
                code,
                name,
                location,
                city,
                state,
                country,
                manager_name,
                capacity,
                is_active,
                created_at
            FROM warehouses 
            WHERE is_active = TRUE
            ORDER BY name ASC
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching warehouses:', err);
                reject(err);
            } else {
                // Map to expected format
                const mapped = results.map(w => ({
                    id: w.id,
                    warehouse_code: w.code,
                    warehouse_name: w.name,
                    location: w.location,
                    city: w.city,
                    state: w.state,
                    country: w.country,
                    manager_name: w.manager_name,
                    capacity: w.capacity,
                    is_active: w.is_active,
                    created_at: w.created_at
                }));
                resolve(mapped);
            }
        });
    });
}

// Helper function to get stores
function getStores() {
    return new Promise((resolve, reject) => {
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
                manager_name,
                area_sqft,
                is_active,
                created_at
            FROM stores 
            WHERE is_active = TRUE
            ORDER BY store_name ASC
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching stores:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// GET /api/transfer-suggestions/warehouses/all
// Get all warehouses
router.get('/warehouses/all', authenticateToken, (req, res) => {
    try {
        const sql = `
            SELECT 
                id,
                code,
                name,
                location,
                city,
                state,
                country,
                manager_name,
                capacity,
                is_active,
                created_at
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

            // Map to expected format
            const mapped = results.map(w => ({
                id: w.id,
                warehouse_code: w.code,
                warehouse_name: w.name,
                location: w.location,
                city: w.city,
                state: w.state,
                country: w.country,
                manager_name: w.manager_name,
                capacity: w.capacity,
                is_active: w.is_active,
                created_at: w.created_at
            }));

            res.json({
                success: true,
                type: 'warehouse',
                data: mapped
            });
        });
    } catch (error) {
        console.error('Warehouse fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/transfer-suggestions/stores/all
// Get all stores
router.get('/stores/all', authenticateToken, (req, res) => {
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
                manager_name,
                area_sqft,
                is_active,
                created_at
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
                type: 'store',
                data: results
            });
        });
    } catch (error) {
        console.error('Store fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/transfer-suggestions/warehouse/:id
// Get specific warehouse details
router.get('/warehouse/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT 
                id,
                code,
                name,
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
            WHERE id = ? AND is_active = TRUE
        `;

        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('Error fetching warehouse:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch warehouse',
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Warehouse not found'
                });
            }

            const w = results[0];
            const mapped = {
                id: w.id,
                warehouse_code: w.code,
                warehouse_name: w.name,
                location: w.location,
                address: w.address,
                city: w.city,
                state: w.state,
                country: w.country,
                pincode: w.pincode,
                phone: w.phone,
                email: w.email,
                manager_name: w.manager_name,
                capacity: w.capacity,
                is_active: w.is_active,
                created_at: w.created_at,
                updated_at: w.updated_at
            };

            res.json({
                success: true,
                warehouse: mapped
            });
        });
    } catch (error) {
        console.error('Warehouse detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET /api/transfer-suggestions/store/:id
// Get specific store details
router.get('/store/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

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
            WHERE id = ? AND is_active = TRUE
        `;

        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('Error fetching store:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch store',
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Store not found'
                });
            }

            res.json({
                success: true,
                store: results[0]
            });
        });
    } catch (error) {
        console.error('Store detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
