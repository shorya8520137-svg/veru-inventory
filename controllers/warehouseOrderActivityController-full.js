const db = require('../db/connection');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for signature uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/signatures');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'signature-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (JPEG, PNG, GIF)'));
        }
    }
});

// Create new warehouse order activity
const createOrderActivity = async (req, res) => {
    try {
        const {
            awb,
            order_ref,
            customer_name,
            product_name,
            logistics,
            phone_number,
            status,
            remarks
        } = req.body;

        // Validate required fields
        if (!awb || !order_ref || !customer_name || !product_name || !logistics || 
            !phone_number || !status || !remarks) {
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

        // Validate phone number
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phone_number.replace(/[\s\-\(\)]/g, ''))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Check if signature file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Signature file is required'
            });
        }

        const signature_url = `/uploads/signatures/${req.file.filename}`;
        const created_by = req.user?.id || null; // Get from auth middleware

        // Insert into database
        const query = `
            INSERT INTO warehouse_order_activity 
            (awb, order_ref, customer_name, product_name, logistics, phone_number, 
             signature_url, status, remarks, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(query, [
            awb, order_ref, customer_name, product_name, logistics,
            phone_number, signature_url, status, remarks, created_by
        ]);

        res.status(201).json({
            success: true,
            message: 'Order activity created successfully',
            data: {
                id: result.insertId,
                awb,
                order_ref,
                customer_name,
                product_name,
                logistics,
                phone_number,
                signature_url,
                status,
                remarks,
                created_by,
                created_at: new Date()
            }
        });

    } catch (error) {
        console.error('Error creating order activity:', error);
        
        // Clean up uploaded file if database insert fails
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all warehouse order activities with pagination and filtering
const getOrderActivities = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            status,
            awb,
            order_ref,
            customer_name,
            date_from,
            date_to
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build WHERE clause
        let whereConditions = [];
        let queryParams = [];

        if (status) {
            whereConditions.push('status = ?');
            queryParams.push(status);
        }

        if (awb) {
            whereConditions.push('awb LIKE ?');
            queryParams.push(`%${awb}%`);
        }

        if (order_ref) {
            whereConditions.push('order_ref LIKE ?');
            queryParams.push(`%${order_ref}%`);
        }

        if (customer_name) {
            whereConditions.push('customer_name LIKE ?');
            queryParams.push(`%${customer_name}%`);
        }

        if (date_from) {
            whereConditions.push('DATE(created_at) >= ?');
            queryParams.push(date_from);
        }

        if (date_to) {
            whereConditions.push('DATE(created_at) <= ?');
            queryParams.push(date_to);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM warehouse_order_activity 
            ${whereClause}
        `;
        const [countResult] = await db.execute(countQuery, queryParams);
        const total = countResult[0].total;

        // Get paginated data
        const dataQuery = `
            SELECT 
                id, awb, order_ref, customer_name, product_name, logistics,
                phone_number, signature_url, status, remarks, created_by,
                created_at, updated_at
            FROM warehouse_order_activity 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [activities] = await db.execute(dataQuery, [...queryParams, parseInt(limit), offset]);

        res.json({
            success: true,
            data: activities,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: total,
                total_pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching order activities:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get single order activity by ID
const getOrderActivityById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                id, awb, order_ref, customer_name, product_name, logistics,
                phone_number, signature_url, status, remarks, created_by,
                created_at, updated_at
            FROM warehouse_order_activity 
            WHERE id = ?
        `;

        const [activities] = await db.execute(query, [id]);

        if (activities.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order activity not found'
            });
        }

        res.json({
            success: true,
            data: activities[0]
        });

    } catch (error) {
        console.error('Error fetching order activity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update order activity status and remarks
const updateOrderActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        // Validate status if provided
        if (status && !['Dispatch', 'Cancel'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "Dispatch" or "Cancel"'
            });
        }

        // Build update query dynamically
        let updateFields = [];
        let queryParams = [];

        if (status) {
            updateFields.push('status = ?');
            queryParams.push(status);
        }

        if (remarks) {
            updateFields.push('remarks = ?');
            queryParams.push(remarks);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        queryParams.push(id);

        const query = `
            UPDATE warehouse_order_activity 
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `;

        const [result] = await db.execute(query, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order activity not found'
            });
        }

        res.json({
            success: true,
            message: 'Order activity updated successfully'
        });

    } catch (error) {
        console.error('Error updating order activity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete order activity
const deleteOrderActivity = async (req, res) => {
    try {
        const { id } = req.params;

        // First get the activity to delete the signature file
        const selectQuery = 'SELECT signature_url FROM warehouse_order_activity WHERE id = ?';
        const [activities] = await db.execute(selectQuery, [id]);

        if (activities.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order activity not found'
            });
        }

        // Delete from database
        const deleteQuery = 'DELETE FROM warehouse_order_activity WHERE id = ?';
        const [result] = await db.execute(deleteQuery, [id]);

        // Delete signature file
        if (activities[0].signature_url) {
            const filePath = path.join(__dirname, '../public', activities[0].signature_url);
            try {
                await fs.unlink(filePath);
            } catch (fileError) {
                console.error('Error deleting signature file:', fileError);
                // Continue even if file deletion fails
            }
        }

        res.json({
            success: true,
            message: 'Order activity deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting order activity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    upload,
    createOrderActivity,
    getOrderActivities,
    getOrderActivityById,
    updateOrderActivity,
    deleteOrderActivity
};