const db = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Website Customer Signup
exports.signup = (req, res) => {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    // Check if email already exists
    const checkQuery = 'SELECT id FROM website_customers WHERE email = ?';
    
    db.query(checkQuery, [email], (err, existing) => {
        if (err) {
            console.error('Check email error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (existing && existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        bcrypt.hash(password, 10, (err, password_hash) => {
            if (err) {
                console.error('Password hash error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing password',
                    error: err.message
                });
            }

            // Insert new customer
            const insertQuery = `
                INSERT INTO website_customers (name, email, password_hash, phone, is_active, created_at)
                VALUES (?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)
            `;

            db.query(insertQuery, [name || null, email, password_hash, phone || null], (err, result) => {
                if (err) {
                    console.error('Insert customer error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create account',
                        error: err.message
                    });
                }

                const customerId = result.insertId;

                // Generate JWT token
                const token = jwt.sign(
                    { 
                        id: customerId, 
                        email: email,
                        type: 'website_customer'
                    },
                    JWT_SECRET,
                    { expiresIn: '30d' }
                );

                // Return success with token
                res.status(201).json({
                    success: true,
                    message: 'Account created successfully',
                    token: token,
                    customer: {
                        id: customerId,
                        name: name,
                        email: email,
                        phone: phone
                    }
                });
            });
        });
    });
};

// Website Customer Login
exports.login = (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    // Find customer by email
    const query = `
        SELECT id, name, email, phone, password_hash, is_active, google_id
        FROM website_customers 
        WHERE email = ?
    `;

    db.query(query, [email], (err, customers) => {
        if (err) {
            console.error('Login query error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!customers || customers.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const customer = customers[0];

        // Check if account is active
        if (!customer.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended. Please contact support.'
            });
        }

        // Verify password
        bcrypt.compare(password, customer.password_hash, (err, isMatch) => {
            if (err) {
                console.error('Password compare error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error verifying password',
                    error: err.message
                });
            }

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Update last login
            const updateQuery = 'UPDATE website_customers SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
            db.query(updateQuery, [customer.id], (err) => {
                if (err) {
                    console.error('Update last login error:', err);
                }
            });

            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: customer.id, 
                    email: customer.email,
                    type: 'website_customer'
                },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            // Return success with token
            res.json({
                success: true,
                message: 'Login successful',
                token: token,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone
                }
            });
        });
    });
};

// Google OAuth Login/Signup
exports.googleAuth = (req, res) => {
    const { google_id, email, name } = req.body;

    // Validate required fields
    if (!google_id || !email) {
        return res.status(400).json({
            success: false,
            message: 'Google ID and email are required'
        });
    }

    // Check if customer exists with this google_id or email
    const checkQuery = 'SELECT * FROM website_customers WHERE google_id = ? OR email = ?';
    
    db.query(checkQuery, [google_id, email], (err, customers) => {
        if (err) {
            console.error('Google auth check error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (customers && customers.length > 0) {
            // Customer exists - login
            const customer = customers[0];

            // Check if account is active
            if (!customer.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is suspended. Please contact support.'
                });
            }

            // Update google_id if not set
            if (!customer.google_id) {
                const updateQuery = 'UPDATE website_customers SET google_id = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?';
                db.query(updateQuery, [google_id, customer.id], (err) => {
                    if (err) console.error('Update google_id error:', err);
                });
            } else {
                // Just update last login
                const updateQuery = 'UPDATE website_customers SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
                db.query(updateQuery, [customer.id], (err) => {
                    if (err) console.error('Update last login error:', err);
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: customer.id, 
                    email: customer.email,
                    type: 'website_customer'
                },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            return res.json({
                success: true,
                message: 'Login successful',
                token: token,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone
                }
            });
        }

        // Customer doesn't exist - create new account
        const insertQuery = `
            INSERT INTO website_customers (name, email, password_hash, google_id, is_active, created_at)
            VALUES (?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)
        `;

        // Use a random password hash for Google accounts
        const dummyPassword = 'google_oauth_' + Math.random().toString(36);
        
        bcrypt.hash(dummyPassword, 10, (err, password_hash) => {
            if (err) {
                console.error('Password hash error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing account',
                    error: err.message
                });
            }

            db.query(insertQuery, [name || null, email, password_hash, google_id], (err, result) => {
                if (err) {
                    console.error('Insert Google customer error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create account',
                        error: err.message
                    });
                }

                const customerId = result.insertId;

                // Generate JWT token
                const token = jwt.sign(
                    { 
                        id: customerId, 
                        email: email,
                        type: 'website_customer'
                    },
                    JWT_SECRET,
                    { expiresIn: '30d' }
                );

                res.status(201).json({
                    success: true,
                    message: 'Account created successfully',
                    token: token,
                    customer: {
                        id: customerId,
                        name: name,
                        email: email,
                        phone: null
                    }
                });
            });
        });
    });
};

// Get current customer profile (requires authentication)
exports.getProfile = (req, res) => {
    const customerId = req.user.id;

    const query = `
        SELECT id, name, email, phone, google_id, is_active, created_at, last_login
        FROM website_customers 
        WHERE id = ?
    `;

    db.query(query, [customerId], (err, customers) => {
        if (err) {
            console.error('Get profile error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!customers || customers.length === 0) {
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
