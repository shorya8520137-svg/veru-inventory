const mysql = require('mysql2');
const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const OTPService = require('../services/OTPService');

class OnboardingController {

    static async ensurePermissions() {
        return new Promise((resolve, reject) => {
            // Insert the permissions (ignore if already exist)
            const insertPerms = `
                INSERT IGNORE INTO permissions (name, display_name, description, category, is_active) VALUES
                ('SYSTEM_SETTINGS', 'System Settings', 'Access system settings', 'SYSTEM', true),
                ('CLIENTS_VIEW', 'View Clients', 'View list of onboarded clients', 'SYSTEM', true),
                ('CLIENTS_CREATE', 'Create Clients', 'Onboard new clients with their own database', 'SYSTEM', true)
            `;
            db.query(insertPerms, (err) => {
                if (err) return reject(err);

                // Assign these permissions to admin and super_admin roles
                const assignPerms = `
                    INSERT IGNORE INTO role_permissions (role_id, permission_id)
                    SELECT r.id, p.id
                    FROM roles r
                    CROSS JOIN permissions p
                    WHERE r.name IN ('admin', 'super_admin')
                    AND p.name IN ('SYSTEM_SETTINGS', 'CLIENTS_VIEW', 'CLIENTS_CREATE')
                `;
                db.query(assignPerms, (err2) => {
                    if (err2) return reject(err2);

                    // Create a client_user role with no permissions (empty dashboard)
                    db.query(
                        "INSERT IGNORE INTO roles (name, display_name, description, color, priority, is_builtin) VALUES ('client_user', 'Client User', 'Limited client access', '#3b82f6', 100, true)",
                        (err3) => {
                            if (err3) return reject(err3);
                            resolve();
                        }
                    );
                });
            });
        });
    }

    static async onboardClient(req, res) {
        try {
            // Ensure required permissions exist in the main DB
            await OnboardingController.ensurePermissions();

            const { company_name, admin_email, admin_password, phone, permissions: selectedPermissions } = req.body;

            if (!company_name || !admin_email || !admin_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Company name, admin email, and admin password are required'
                });
            }

            // Sanitize company name for DB use
            const dbSafeName = company_name
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '')
                || `client_${Date.now()}`;

            const clientDbName = `client_${dbSafeName}`;

            // Check if client already exists
            const checkClientQuery = `SELECT id FROM clients WHERE company_name = ? OR db_name = ? LIMIT 1`;
            db.query(checkClientQuery, [company_name, clientDbName], async (err, existing) => {
                if (err) {
                    console.error('Client check error:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }

                if (existing && existing.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'A client with this company name already exists'
                    });
                }

                // Create the new database
                const createDbQuery = `CREATE DATABASE IF NOT EXISTS \`${clientDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`;
                db.query(createDbQuery, async (dbErr) => {
                    if (dbErr) {
                        console.error('Create database error:', dbErr);
                        return res.status(500).json({ success: false, message: 'Failed to create client database' });
                    }

                    console.log(`✅ Created database: ${clientDbName}`);

                    // Connect to the new database to create tables
                    const clientConn = mysql.createConnection({
                        host: process.env.DB_HOST || '127.0.0.1',
                        user: process.env.DB_USER || 'inventory_user',
                        password: process.env.DB_PASSWORD || 'StrongPass@123',
                        database: clientDbName,
                        port: process.env.DB_PORT || 3306,
                        multipleStatements: true
                    });

                    clientConn.connect(async (connErr) => {
                        if (connErr) {
                            console.error('Client DB connection error:', connErr);
                            return res.status(500).json({ success: false, message: 'Failed to connect to client database' });
                        }

                        try {
                            // Create tables in the new database
                            await OnboardingController.createClientSchema(clientConn);

                            // Create admin role and user
                            const adminUser = await OnboardingController.createAdminUser(
                                clientConn,
                                clientDbName,
                                company_name,
                                admin_email,
                                admin_password,
                                phone,
                                selectedPermissions
                            );

                            // Store client record in main DB
                            const insertClientQuery = `
                                INSERT INTO clients (company_name, db_name, admin_email, admin_phone, status, created_by)
                                VALUES (?, ?, ?, ?, 'active', ?)
                            `;
                            const createdBy = req.user?.id || 1;

                            db.query(insertClientQuery, [company_name, clientDbName, admin_email, phone || null, createdBy], async (insertErr, result) => {
                                if (insertErr) {
                                    clientConn.end();
                                    console.error('Insert client record error:', insertErr);
                                    return res.status(500).json({ success: false, message: 'Failed to save client record' });
                                }

                                const clientId = result.insertId;

                                let tenantWarning = '';
                                try {
                                    await OnboardingController.createTenantAndUser(
                                        clientId, company_name, admin_email, admin_password
                                    );
                                } catch (tenantErr) {
                                    console.error('❌ Tenant/user creation error:', tenantErr);
                                    tenantWarning = ' Client DB created but login setup failed — contact support.';
                                }

                                clientConn.end();

                                res.json({
                                    success: true,
                                    message: `Client "${company_name}" onboarded successfully.${tenantWarning}`,
                                    data: {
                                        client_id: clientId,
                                        company_name,
                                        db_name: clientDbName,
                                        admin_email,
                                        admin_password: admin_password,
                                        login_url: `${req.protocol}://${req.get('host')}/login`,
                                        login_ready: !tenantWarning
                                    }
                                });
                            });

                        } catch (schemaErr) {
                            clientConn.end();
                            console.error('Schema creation error:', schemaErr);
                            res.status(500).json({ success: false, message: 'Failed to create client schema: ' + schemaErr.message });
                        }
                    });
                });
            });

        } catch (error) {
            console.error('Onboarding error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    static async createClientSchema(conn) {
        return new Promise((resolve, reject) => {
            // Create core tables for the client database
            const schema = `
                CREATE TABLE IF NOT EXISTS permissions (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    display_name VARCHAR(255),
                    category VARCHAR(100),
                    description TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS roles (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    display_name VARCHAR(255),
                    description TEXT,
                    color VARCHAR(7) DEFAULT '#64748b',
                    priority INT DEFAULT 999,
                    is_builtin BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS role_permissions (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    role_id INT NOT NULL,
                    permission_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_role_permission (role_id, permission_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    password_hash VARCHAR(255),
                    phone VARCHAR(50),
                    role_id INT,
                    is_active BOOLEAN DEFAULT true,
                    two_factor_enabled BOOLEAN DEFAULT false,
                    two_factor_secret VARCHAR(255),
                    login_count INT DEFAULT 0,
                    last_login TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    session_token VARCHAR(500) NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    location_country VARCHAR(100),
                    location_city VARCHAR(100),
                    is_active BOOLEAN DEFAULT true,
                    last_activity_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `;

            conn.query(schema, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    static getAvailablePermissions() {
        return [
            { name: 'PRODUCTS_VIEW', display_name: 'View Products', category: 'PRODUCTS' },
            { name: 'PRODUCTS_CREATE', display_name: 'Create Products', category: 'PRODUCTS' },
            { name: 'PRODUCTS_EDIT', display_name: 'Edit Products', category: 'PRODUCTS' },
            { name: 'PRODUCTS_DELETE', display_name: 'Delete Products', category: 'PRODUCTS' },
            { name: 'PRODUCTS_BULK_IMPORT', display_name: 'Bulk Import Products', category: 'PRODUCTS' },
            { name: 'PRODUCTS_EXPORT', display_name: 'Export Products', category: 'PRODUCTS' },
            { name: 'PRODUCTS_CATEGORIES', display_name: 'Manage Categories', category: 'PRODUCTS' },
            { name: 'PRODUCTS_SELF_TRANSFER', display_name: 'Self Transfer Products', category: 'PRODUCTS' },
            { name: 'INVENTORY_VIEW', display_name: 'View Inventory', category: 'INVENTORY' },
            { name: 'INVENTORY_EDIT', display_name: 'Edit Inventory', category: 'INVENTORY' },
            { name: 'INVENTORY_TIMELINE', display_name: 'View Inventory Timeline', category: 'INVENTORY' },
            { name: 'INVENTORY_ADJUST', display_name: 'Adjust Inventory', category: 'INVENTORY' },
            { name: 'INVENTORY_TRANSFER', display_name: 'Transfer Inventory', category: 'INVENTORY' },
            { name: 'INVENTORY_EXPORT', display_name: 'Export Inventory', category: 'INVENTORY' },
            { name: 'ORDERS_VIEW', display_name: 'View Orders', category: 'ORDERS' },
            { name: 'ORDERS_CREATE', display_name: 'Create Orders', category: 'ORDERS' },
            { name: 'ORDERS_EDIT', display_name: 'Edit Orders', category: 'ORDERS' },
            { name: 'ORDERS_EXPORT', display_name: 'Export Orders', category: 'ORDERS' },
            { name: 'OPERATIONS_DISPATCH', display_name: 'Dispatch Operations', category: 'OPERATIONS' },
            { name: 'OPERATIONS_DAMAGE', display_name: 'Damage Operations', category: 'OPERATIONS' },
            { name: 'OPERATIONS_RETURN', display_name: 'Return Operations', category: 'OPERATIONS' },
            { name: 'OPERATIONS_BULK', display_name: 'Bulk Upload', category: 'OPERATIONS' },
            { name: 'OPERATIONS_SELF_TRANSFER', display_name: 'Self Transfer', category: 'OPERATIONS' },
            { name: 'DASHBOARD_VIEW', display_name: 'View Dashboard', category: 'DASHBOARD' },
            { name: 'TRACKING_VIEW', display_name: 'View Tracking', category: 'TRACKING' },
            { name: 'TRACKING_CREATE', display_name: 'Create Tracking', category: 'TRACKING' },
            { name: 'TRACKING_EDIT', display_name: 'Edit Tracking', category: 'TRACKING' },
            { name: 'TRACKING_DELETE', display_name: 'Delete Tracking', category: 'TRACKING' },
            { name: 'TRACKING_EXPORT', display_name: 'Export Tracking', category: 'TRACKING' },
            { name: 'TRACKING_TIMELINE', display_name: 'Tracking Timeline', category: 'TRACKING' },
            { name: 'TRACKING_BULK', display_name: 'Bulk Tracking', category: 'TRACKING' },
            { name: 'MESSAGES_VIEW', display_name: 'View Messages', category: 'MESSAGES' },
            { name: 'SYSTEM_USER_MANAGEMENT', display_name: 'User Management', category: 'SYSTEM' },
            { name: 'SYSTEM_ROLE_MANAGEMENT', display_name: 'Role Management', category: 'SYSTEM' },
            { name: 'SYSTEM_AUDIT_LOG', display_name: 'Audit Log', category: 'SYSTEM' },
            { name: 'SYSTEM_SETTINGS', display_name: 'System Settings', category: 'SYSTEM' },
        ];
    }

    static async listAvailablePermissions(req, res) {
        res.json({ success: true, data: OnboardingController.getAvailablePermissions() });
    }

    static async createAdminUser(conn, dbName, companyName, email, password, phone, selectedPermissions) {
        return new Promise(async (resolve, reject) => {
            try {
                const allPermissions = OnboardingController.getAvailablePermissions();

                // Filter to only selected permissions, or use all if none specified
                const permsToSeed = selectedPermissions && selectedPermissions.length > 0
                    ? allPermissions.filter(p => selectedPermissions.includes(p.name))
                    : allPermissions;

                // Insert permissions
                const permValues = permsToSeed.map(p => [p.name, p.display_name, p.category]);
                const permQuery = 'INSERT IGNORE INTO permissions (name, display_name, category) VALUES ?';
                conn.query(permQuery, [permValues], (permErr, permResult) => {
                    if (permErr) return reject(permErr);

                    // Get all permission IDs
                    conn.query('SELECT id, name FROM permissions', (selectErr, permissions) => {
                        if (selectErr) return reject(selectErr);

                        // Create Admin role
                        const roleQuery = "INSERT INTO roles (name, display_name, description, color, priority, is_builtin) VALUES ('admin', 'Admin', 'Full operational access', '#ea580c', 2, true)";
                        conn.query(roleQuery, (roleErr, roleResult) => {
                            if (roleErr) return reject(roleErr);

                            const adminRoleId = roleResult.insertId;

                            // Assign selected permissions to admin role
                            const rpValues = permissions.map(p => [adminRoleId, p.id]);
                            const rpQuery = 'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ?';
                            conn.query(rpQuery, [rpValues], (rpErr) => {
                                if (rpErr) return reject(rpErr);

                                // Hash the password and create user
                                bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
                                    if (hashErr) return reject(hashErr);

                                    const userQuery = 'INSERT INTO users (name, email, password, password_hash, phone, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, true)';
                                    conn.query(userQuery, [companyName + ' Admin', email, password, hashedPassword, phone || null, adminRoleId], (userErr, userResult) => {
                                        if (userErr) return reject(userErr);
                                        resolve({ id: userResult.insertId, role_id: adminRoleId });
                                    });
                                });
                            });
                        });
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    static async sendOTP(req, res) {
        try {
            const { phone } = req.body;
            if (!phone) {
                return res.status(400).json({ success: false, message: 'Phone number is required' });
            }

            const result = await OTPService.sendAndStoreOTP(phone);
            if (result.success) {
                res.json({ success: true, message: 'OTP sent successfully', method: result.method, otp: result.otp || undefined });
            } else {
                res.status(500).json({ success: false, message: result.error || 'Failed to send OTP' });
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    static async verifyOTP(req, res) {
        try {
            const { phone, otp } = req.body;
            if (!phone || !otp) {
                return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
            }

            const result = await OTPService.verifyOTP(phone, otp);
            if (result.valid) {
                res.json({ success: true, message: 'Phone verified successfully' });
            } else {
                res.status(400).json({ success: false, message: result.message });
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    static async createTenantAndUser(clientId, companyName, email, password) {
        return new Promise((resolve, reject) => {
            const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

            // Create tenant (or get existing id if slug already exists)
            db.query('INSERT INTO tenants (slug, name, is_active) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = VALUES(name)',
                [slug, companyName],
                (tenantErr, tenantResult) => {
                    if (tenantErr) return reject(tenantErr);

                    const tenantId = tenantResult.insertId;

                    // Get the client_user role (limited access, no permissions)
                    db.query("SELECT id FROM roles WHERE name = 'client_user' LIMIT 1",
                        (roleErr, roles) => {
                            if (roleErr) return reject(roleErr);
                            const roleId = roles.length > 0 ? roles[0].id : null;

                            if (!roleId) return reject(new Error('client_user role not found'));

                            // Hash password and create user in main DB
                            bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
                                if (hashErr) return reject(hashErr);

                                db.query(
                                    `INSERT INTO users (name, email, password, role_id, tenant_id, is_active)
                                     VALUES (?, ?, ?, ?, ?, 1)
                                     ON DUPLICATE KEY UPDATE tenant_id = VALUES(tenant_id), password = VALUES(password)`,
                                    [`${companyName} Admin`, email, hashedPassword, roleId, tenantId],
                                    (userErr) => {
                                        if (userErr) return reject(userErr);
                                        resolve({ tenantId, roleId });
                                    }
                                );
                            });
                        }
                    );
                }
            );
        });
    }

    static async listClients(req, res) {
        try {
            db.query('SELECT id, company_name, db_name, admin_email, status, created_at FROM clients ORDER BY created_at DESC', (err, clients) => {
                if (err) {
                    console.error('List clients error:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }

                res.json({ success: true, data: clients });
            });
        } catch (error) {
            console.error('List clients error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

module.exports = OnboardingController;
