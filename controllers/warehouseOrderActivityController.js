// Simple controller without multer dependency for Node.js v18 compatibility
let db;
try {
    db = require('../db/connection');
} catch (error) {
    console.log('Database connection not available, using mock responses');
    db = null;
}

// Simple upload middleware that doesn't require multer
const upload = {
    single: (fieldName) => (req, res, next) => {
        // Simple middleware that just passes through
        // In production, this would handle file uploads
        req.file = null; // Simulate no file for now
        next();
    }
};

// Get warehouse staff data for dropdowns
const getWarehouseStaff = async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const query = `
            SELECT warehouse, name 
            FROM warehousestaff_processed 
            ORDER BY warehouse, name
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('❌ Database fetch error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch warehouse staff',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            // Group staff by warehouse
            const warehouseStaff = {};
            results.forEach(row => {
                if (!warehouseStaff[row.warehouse]) {
                    warehouseStaff[row.warehouse] = [];
                }
                warehouseStaff[row.warehouse].push(row.name);
            });

            console.log('✅ Warehouse staff fetched successfully');

            res.json({
                success: true,
                data: warehouseStaff,
                warehouses: Object.keys(warehouseStaff),
                message: 'Warehouse staff fetched successfully'
            });
        });
    } catch (error) {
        console.error('Error fetching warehouse staff:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get logistics data for dropdown
const getLogistics = async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const query = `
            SELECT id, name 
            FROM logistics 
            ORDER BY name
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('❌ Database fetch error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch logistics',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            console.log('✅ Logistics fetched successfully');

            res.json({
                success: true,
                data: results,
                message: 'Logistics fetched successfully'
            });
        });
    } catch (error) {
        console.error('Error fetching logistics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Create new warehouse order activity (updated with warehouse and processed_by)
const createOrderActivity = async (req, res) => {
    try {
        const {
            awb,
            order_ref,
            customer_name,
            product_name,
            logistics,
            warehouse,
            processed_by,
            status,
            remarks
        } = req.body;

        // Validate required fields
        if (!awb || !order_ref || !customer_name || !product_name || !logistics || 
            !warehouse || !processed_by || !status || !remarks) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate status
        if (!['Dispatch', 'Cancel'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "Dispatch" or "Cancel"'
            });
        }

        // Validate warehouse format
        if (!warehouse.endsWith('_WH')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid warehouse format'
            });
        }

        const created_by = req.user?.id || null; // Get from auth middleware

        // Insert into database using callback-based query
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const insertQuery = `
            INSERT INTO warehouse_order_activity 
            (awb, order_ref, customer_name, product_name, logistics, warehouse, processed_by, status, remarks, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            awb,
            order_ref,
            customer_name,
            product_name,
            logistics,
            warehouse,
            processed_by,
            status,
            remarks,
            created_by
        ];

        // Use callback-based query method
        db.query(insertQuery, values, (error, results) => {
            if (error) {
                console.error('❌ Database insert error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to insert order activity',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            console.log('✅ Order activity inserted successfully:', {
                insertId: results.insertId,
                customer_name,
                awb,
                warehouse,
                processed_by,
                status
            });

            res.status(201).json({
                success: true,
                message: 'Order activity created successfully',
                data: {
                    id: results.insertId,
                    awb,
                    order_ref,
                    customer_name,
                    product_name,
                    logistics,
                    warehouse,
                    processed_by,
                    status,
                    remarks,
                    created_by,
                    created_at: new Date()
                }
            });
        });

    } catch (error) {
        console.error('Error creating order activity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all warehouse order activities (updated to include warehouse and processed_by)
const getOrderActivities = async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const query = `
            SELECT 
                id, awb, order_ref, customer_name, product_name, logistics,
                warehouse, processed_by, status, remarks, created_by, created_at, updated_at
            FROM warehouse_order_activity 
            ORDER BY created_at DESC
        `;

        db.query(query, (error, results) => {
            if (error) {
                console.error('❌ Database fetch error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch order activities',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            console.log('✅ Order activities fetched successfully:', results.length, 'records');

            res.json({
                success: true,
                data: results,
                total: results.length,
                message: 'Order activities fetched successfully'
            });
        });
    } catch (error) {
        console.error('Error fetching order activities:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get single order activity by ID
const getOrderActivityById = async (req, res) => {
    try {
        res.status(404).json({
            success: false,
            message: 'Order activity system not yet set up'
        });
    } catch (error) {
        console.error('Error fetching order activity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update order activity
const updateOrderActivity = async (req, res) => {
    try {
        res.status(501).json({
            success: false,
            message: 'Order activity system not yet set up'
        });
    } catch (error) {
        console.error('Error updating order activity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete order activity
const deleteOrderActivity = async (req, res) => {
    try {
        res.status(501).json({
            success: false,
            message: 'Order activity system not yet set up'
        });
    } catch (error) {
        console.error('Error deleting order activity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    upload,
    getWarehouseStaff,
    getLogistics,
    createOrderActivity,
    getOrderActivities,
    getOrderActivityById,
    updateOrderActivity,
    deleteOrderActivity
};