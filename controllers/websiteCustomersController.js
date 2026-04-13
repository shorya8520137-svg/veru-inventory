const db = require('../db/connection');

// Get all website customers with pagination and filters
exports.getAllCustomers = (req, res) => {
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT 
            id, name, email, phone, google_id, is_active, 
            created_at, updated_at, last_login
        FROM website_customers
        WHERE 1=1
    `;
    const params = [];

    // Search filter
    if (search) {
        query += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    // Status filter
    if (status !== 'all') {
        query += ` AND is_active = ?`;
        params.push(status === 'active' ? 1 : 0);
    }

    // Build count query separately to avoid string replacement issues
    let countQuery = 'SELECT COUNT(*) as total FROM website_customers WHERE 1=1';
    const countParams = [];

    // Apply same filters to count query
    if (search) {
        countQuery += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status !== 'all') {
        countQuery += ` AND is_active = ?`;
        countParams.push(status === 'active' ? 1 : 0);
    }
    
    db.query(countQuery, countParams, (err, countResult) => {
        if (err) {
            console.error('Get customers count error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch customers count',
                error: err.message
            });
        }

        // COUNT(*) should always return a result, even if it's 0
        const total = (countResult && countResult[0]) ? countResult[0].total : 0;

        // Add pagination
        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        db.query(query, params, (err, customers) => {
            if (err) {
                console.error('Get customers error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch customers',
                    error: err.message
                });
            }

            res.json({
                success: true,
                data: customers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        });
    });
};

// Get single customer by ID
exports.getCustomerById = (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT 
            id, name, email, phone, google_id, is_active, 
            created_at, updated_at, last_login
        FROM website_customers
        WHERE id = ?
    `;

    db.query(query, [id], (err, customers) => {
        if (err) {
            console.error('Get customer error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch customer',
                error: err.message
            });
        }

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: customers[0]
        });
    });
};

// Suspend/Activate customer (toggle is_active)
exports.toggleCustomerStatus = (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
        return res.status(400).json({
            success: false,
            message: 'is_active must be a boolean value'
        });
    }

    const query = `
        UPDATE website_customers 
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.query(query, [is_active, id], (err, result) => {
        if (err) {
            console.error('Toggle customer status error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to update customer status',
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            message: `Customer ${is_active ? 'activated' : 'suspended'} successfully`,
            data: { id, is_active }
        });
    });
};

// Get customer statistics
exports.getCustomerStats = (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_customers,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_customers,
            SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as suspended_customers,
            SUM(CASE WHEN google_id IS NOT NULL THEN 1 ELSE 0 END) as google_signups,
            SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_signups,
            SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_signups,
            SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as month_signups
        FROM website_customers
    `;

    db.query(query, (err, stats) => {
        if (err) {
            console.error('Get customer stats error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch customer statistics',
                error: err.message
            });
        }

        res.json({
            success: true,
            data: stats[0]
        });
    });
};

// Delete customer (soft delete by setting is_active = false)
exports.deleteCustomer = (req, res) => {
    const { id } = req.params;

    const query = `
        UPDATE website_customers 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Delete customer error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete customer',
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    });
};

// Get recent customer logins
exports.getRecentLogins = (req, res) => {
    const { limit = 10 } = req.query;

    const query = `
        SELECT 
            id, name, email, last_login, is_active
        FROM website_customers
        WHERE last_login IS NOT NULL
        ORDER BY last_login DESC
        LIMIT ?
    `;

    db.query(query, [parseInt(limit)], (err, customers) => {
        if (err) {
            console.error('Get recent logins error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch recent logins',
                error: err.message
            });
        }

        res.json({
            success: true,
            data: customers
        });
    });
};
