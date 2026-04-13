const db = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class PermissionsController {
    // ================= AUTHENTICATION ================= //
    
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }
            
            // Get user with role information
            const userQuery = `
                SELECT u.*, r.name as role_name, r.display_name as role_display_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.email = ?
            `;
            
            db.query(userQuery, [email], async (err, users) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error'
                    });
                }
                
                if (!users || users.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }
                
                const user = users[0];
                
                // Verify password - check both password and password_hash columns
                let isValidPassword = false;
                if (user.password_hash) {
                    isValidPassword = await bcrypt.compare(password, user.password_hash);
                } else if (user.password) {
                    // For plain text passwords (temporary - should be hashed)
                    isValidPassword = (password === user.password);
                }
                
                if (!isValidPassword) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }
                
                // Get user permissions
                const permQuery = `
                    SELECT p.name, p.display_name, p.category
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ? AND p.is_active = true
                `;
                
                db.query(permQuery, [user.role_id], async (permErr, permissions) => {
                    if (permErr) {
                        console.error('Permissions error:', permErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to load permissions'
                        });
                    }
                    
                    // Update last login
                    db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id], (updateErr) => {
                        if (updateErr) {
                            console.warn('Failed to update last login:', updateErr);
                        }
                    });
                    
                    // Generate JWT token
                    const token = jwt.sign(
                        { 
                            userId: user.id, 
                            email: user.email, 
                            role: user.role_name,
                            roleId: user.role_id
                        },
                        process.env.JWT_SECRET || 'your-secret-key',
                        { expiresIn: '24h' }
                    );
                    
                    // Log LOGIN audit with proper IP and user agent
                    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                                     req.headers['x-real-ip'] ||
                                     req.connection.remoteAddress ||
                                     req.ip ||
                                     '127.0.0.1';
                    
                    PermissionsController.createAuditLog(user.id, 'LOGIN', 'SESSION', user.id, { 
                        user_name: user.name,
                        user_email: user.email,
                        user_role: user.role_name,
                        login_time: new Date().toISOString(),
                        ip_address: ipAddress,
                        user_agent: req.get('User-Agent') || 'Unknown'
                    }, () => {});
                    
                    res.json({
                        success: true,
                        message: 'Login successful',
                        token,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role_name,
                            roleDisplayName: user.role_display_name,
                            permissions: permissions.map(p => p.name)
                        }
                    });
                });
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static logout(req, res) {
        try {
            // Log LOGOUT audit with proper IP and user agent
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                             req.headers['x-real-ip'] ||
                             req.connection.remoteAddress ||
                             req.ip ||
                             '127.0.0.1';
            
            PermissionsController.createAuditLog(req.user?.id, 'LOGOUT', 'SESSION', req.user?.id, { 
                user_name: req.user?.name || 'Unknown',
                user_email: req.user?.email || 'Unknown',
                logout_time: new Date().toISOString(),
                ip_address: ipAddress,
                user_agent: req.get('User-Agent') || 'Unknown'
            }, () => {});
            
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static refreshToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            // Generate new token
            const newToken = jwt.sign(
                { 
                    userId: decoded.userId, 
                    email: decoded.email, 
                    role: decoded.role,
                    roleId: decoded.roleId
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                token: newToken
            });
            
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    }
    
    // ================= USER MANAGEMENT ================= //
    
    static getUsers(req, res) {
        try {
            const query = `
                SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.last_login, u.created_at,
                       r.name as role_name, r.display_name as role_display_name, r.color as role_color
                FROM users u
                JOIN roles r ON u.role_id = r.id
                ORDER BY u.created_at DESC
            `;
            
            db.query(query, (err, users) => {
                if (err) {
                    console.error('Get users error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch users'
                    });
                }
                
                res.json({
                    success: true,
                    data: users
                });
            });
            
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users'
            });
        }
    }
    
    static getUserById(req, res) {
        try {
            const { userId } = req.params;
            
            const query = `
                SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.last_login, u.created_at,
                       r.name as role_name, r.display_name as role_display_name, r.color as role_color
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `;
            
            db.query(query, [userId], (err, users) => {
                if (err) {
                    console.error('Get user error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch user'
                    });
                }
                
                if (users.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }
                
                const user = users[0];
                
                // Get user permissions
                const permQuery = `
                    SELECT p.name, p.display_name, p.category
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ? AND p.is_active = true
                `;
                
                db.query(permQuery, [user.role_id], (permErr, permissions) => {
                    if (permErr) {
                        console.error('Get permissions error:', permErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to fetch user permissions'
                        });
                    }
                    
                    user.permissions = permissions;
                    
                    res.json({
                        success: true,
                        data: user
                    });
                });
            });
            
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user'
            });
        }
    }
    
    static async createUser(req, res) {
        try {
            const { name, email, password, role_id, is_active = 1 } = req.body;
            
            if (!name || !email || !password || !role_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, password, and role are required'
                });
            }
            
            // Check if email already exists
            db.query('SELECT id FROM users WHERE email = ?', [email], async (err, existingUsers) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error'
                    });
                }
                
                if (existingUsers.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already exists'
                    });
                }
                
                // Hash password
                const passwordHash = await bcrypt.hash(password, 10);
                
                // Create user
                const insertQuery = `
                    INSERT INTO users (name, email, password, role_id, is_active)
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                db.query(insertQuery, [name, email, passwordHash, role_id, is_active], (insertErr, result) => {
                    if (insertErr) {
                        console.error('Create user error:', insertErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to create user'
                        });
                    }
                    
                    // Log audit
                    PermissionsController.createAuditLog(req.user?.id, 'CREATE', 'USER', result.insertId, {
                        name, email, role_id, is_active
                    }, () => {});
                    
                    res.status(201).json({
                        success: true,
                        message: 'User created successfully',
                        data: { id: result.insertId }
                    });
                });
            });
            
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create user'
            });
        }
    }
    
    static async updateUser(req, res) {
        const { userId } = req.params;
        const { name, email, password, roleId, role_id } = req.body;
        
        console.log('🔍 UPDATE USER - Input:', { userId, name, email, password: password ? '***PROVIDED***' : 'NOT_PROVIDED', roleId, role_id });
        
        // Use role_id if provided, otherwise use roleId
        const finalRoleId = role_id || roleId;
        
        // Simple validation
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if user exists first
        const checkSql = 'SELECT id, name, email, role_id FROM users WHERE id = ?';
        console.log('🔍 Checking user existence with SQL:', checkSql, [userId]);
        
        db.query(checkSql, [userId], async (err, existingUsers) => {
            if (err) {
                console.error('🔍 Database check error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error during user check'
                });
            }
            
            console.log('🔍 User check result:', { found: existingUsers.length, users: existingUsers });
            
            if (existingUsers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Build dynamic update query
            let updateFields = [];
            let updateValues = [];
            
            if (name) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }
            
            if (email) {
                updateFields.push('email = ?');
                updateValues.push(email);
            }
            
            if (finalRoleId) {
                updateFields.push('role_id = ?');
                updateValues.push(finalRoleId);
            }
            
            // Handle password update
            if (password && password.trim() !== '') {
                try {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    updateFields.push('password = ?');
                    updateValues.push(hashedPassword);
                    console.log('🔍 Password will be updated (hashed)');
                } catch (hashErr) {
                    console.error('🔍 Password hashing error:', hashErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to process password'
                    });
                }
            }
            
            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }
            
            // Add user ID for WHERE clause
            updateValues.push(userId);
            
            const updateSql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
            console.log('🔍 Executing update SQL:', updateSql, updateValues.map((val, idx) => updateFields[idx]?.includes('password') ? '***HASHED_PASSWORD***' : val));
            
            db.query(updateSql, updateValues, (updateErr, result) => {
                if (updateErr) {
                    console.error('🔍 Update error:', updateErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error during update'
                    });
                }
                
                console.log('🔍 Update result:', result);
                
                // Log audit with password update info
                const auditData = { name, email, role_id: finalRoleId };
                if (password && password.trim() !== '') {
                    auditData.password_updated = true;
                }
                
                PermissionsController.createAuditLog(req.user?.id, 'UPDATE', 'USER', userId, auditData, () => {});
                
                res.json({
                    success: true,
                    message: 'User updated successfully'
                });
            });
        });
    }
    
    static deleteUser(req, res) {
        const { userId } = req.params;
        
        // Check if user exists
        db.query('SELECT id FROM users WHERE id = ?', [userId], (err, existingUsers) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }
            
            if (existingUsers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Delete user
            db.query('DELETE FROM users WHERE id = ?', [userId], (deleteErr) => {
                if (deleteErr) {
                    console.error('Delete user error:', deleteErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to delete user'
                    });
                }
                
                // Log audit
                PermissionsController.createAuditLog(req.user?.id, 'DELETE', 'USER', userId, {}, () => {});
                
                res.json({
                    success: true,
                    message: 'User deleted successfully'
                });
            });
        });
    }
    
    // ================= ROLE MANAGEMENT ================= //
    
    static getRoles(req, res) {
        const sql = `
            SELECT r.id, r.name, r.display_name, r.description, r.color, r.priority, r.is_active,
                   COUNT(DISTINCT u.id) as user_count,
                   COUNT(DISTINCT CASE WHEN p.is_active = true THEN rp.permission_id END) as permission_count
            FROM roles r
            LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE r.is_active = true
            GROUP BY r.id, r.name, r.display_name, r.description, r.color, r.priority, r.is_active
            ORDER BY r.priority
        `;
        
        db.query(sql, (err, roles) => {
            if (err) {
                console.error('Get roles error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch roles'
                });
            }
            
            // Get permissions for each role
            if (!roles || roles.length === 0) {
                return res.json({
                    success: true,
                    data: []
                });
            }
            
            // Fetch permissions for all roles
            const roleIds = roles.map(r => r.id);
            const permissionsSql = `
                SELECT rp.role_id, p.id, p.name, p.display_name, p.category
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                WHERE rp.role_id IN (${roleIds.map(() => '?').join(',')}) AND p.is_active = true
                ORDER BY p.category, p.name
            `;
            
            db.query(permissionsSql, roleIds, (permErr, permissions) => {
                if (permErr) {
                    console.error('Get role permissions error:', permErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch role permissions'
                    });
                }
                
                // Group permissions by role_id
                const permissionsByRole = {};
                permissions.forEach(perm => {
                    if (!permissionsByRole[perm.role_id]) {
                        permissionsByRole[perm.role_id] = [];
                    }
                    permissionsByRole[perm.role_id].push({
                        id: perm.id,
                        name: perm.name,
                        display_name: perm.display_name,
                        category: perm.category
                    });
                });
                
                // Add permissions to each role
                const rolesWithPermissions = roles.map(role => ({
                    ...role,
                    permissions: permissionsByRole[role.id] || []
                }));
                
                res.json({
                    success: true,
                    data: rolesWithPermissions
                });
            });
        });
    }
    
    static createRole(req, res) {
        const { name, displayName, display_name, description, color = '#6366f1', permissionIds = [] } = req.body;
        
        // Accept both camelCase and snake_case
        const finalDisplayName = displayName || display_name;
        
        if (!name || !finalDisplayName) {
            return res.status(400).json({
                success: false,
                message: 'Name and display name are required'
            });
        }
        
        // Create role
        const insertSql = `
            INSERT INTO roles (name, display_name, description, color)
            VALUES (?, ?, ?, ?)
        `;
        
        db.query(insertSql, [name, finalDisplayName, description, color], (err, result) => {
            if (err) {
                console.error('Create role error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create role'
                });
            }
            
            const roleId = result.insertId;
            
            // Assign permissions
            if (permissionIds.length > 0) {
                const values = permissionIds.map(permId => `(${roleId}, ${permId})`).join(',');
                const permSql = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`;
                
                db.query(permSql, (permErr) => {
                    if (permErr) {
                        console.error('Assign permissions error:', permErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Role created but failed to assign permissions'
                        });
                    }
                    
                    // Log audit
                    PermissionsController.createAuditLog(req.user?.id, 'CREATE', 'ROLE', roleId, {
                        name, displayName: finalDisplayName, description, color, permissionIds
                    }, () => {});
                    
                    res.status(201).json({
                        success: true,
                        message: 'Role created successfully',
                        data: { id: roleId }
                    });
                });
            } else {
                // No permissions to assign
                PermissionsController.createAuditLog(req.user?.id, 'CREATE', 'ROLE', roleId, {
                    name, displayName: finalDisplayName, description, color, permissionIds
                }, () => {});
                
                res.status(201).json({
                    success: true,
                    message: 'Role created successfully',
                    data: { id: roleId }
                });
            }
        });
    }
    
    static updateRole(req, res) {
        const { roleId } = req.params;
        const { name, displayName, display_name, description, color, permissionIds = [] } = req.body;
        
        // Accept both camelCase and snake_case
        const finalDisplayName = displayName || display_name;
        
        if (!name || !finalDisplayName) {
            return res.status(400).json({
                success: false,
                message: 'Name and display name are required'
            });
        }
        
        // Update role basic info
        const updateSql = `
            UPDATE roles 
            SET name = ?, display_name = ?, description = ?, color = ?
            WHERE id = ?
        `;
        
        db.query(updateSql, [name, finalDisplayName, description, color, roleId], (err, result) => {
            if (err) {
                console.error('Update role error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update role'
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            
            // Update permissions if provided
            if (permissionIds.length >= 0) {
                // First, delete existing permissions
                const deleteSql = `DELETE FROM role_permissions WHERE role_id = ?`;
                
                db.query(deleteSql, [roleId], (deleteErr) => {
                    if (deleteErr) {
                        console.error('Delete role permissions error:', deleteErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update role permissions'
                        });
                    }
                    
                    // Insert new permissions if any
                    if (permissionIds.length > 0) {
                        const values = permissionIds.map(permId => `(${roleId}, ${permId})`).join(',');
                        const insertSql = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`;
                        
                        db.query(insertSql, (insertErr) => {
                            if (insertErr) {
                                console.error('Insert role permissions error:', insertErr);
                                return res.status(500).json({
                                    success: false,
                                    message: 'Failed to update role permissions'
                                });
                            }
                            
                            // Log audit
                            PermissionsController.createAuditLog(req.user?.id, 'UPDATE', 'ROLE', roleId, {
                                name, displayName: finalDisplayName, description, color, permissionIds
                            }, () => {});
                            
                            res.json({
                                success: true,
                                message: 'Role updated successfully'
                            });
                        });
                    } else {
                        // No permissions to assign
                        PermissionsController.createAuditLog(req.user?.id, 'UPDATE', 'ROLE', roleId, {
                            name, displayName: finalDisplayName, description, color, permissionIds
                        }, () => {});
                        
                        res.json({
                            success: true,
                            message: 'Role updated successfully'
                        });
                    }
                });
            } else {
                // No permission update requested
                PermissionsController.createAuditLog(req.user?.id, 'UPDATE', 'ROLE', roleId, {
                    name, displayName: finalDisplayName, description, color
                }, () => {});
                
                res.json({
                    success: true,
                    message: 'Role updated successfully'
                });
            }
        });
    }
    
    // ================= PERMISSION MANAGEMENT ================= //
    
    static getRolePermissions(req, res) {
        const { roleId } = req.params;
        
        const sql = `
            SELECT p.id, p.name, p.display_name, p.category, p.description
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ? AND p.is_active = true
            ORDER BY p.category, p.name
        `;
        
        db.query(sql, [roleId], (err, permissions) => {
            if (err) {
                console.error('Get role permissions error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch role permissions'
                });
            }
            
            res.json({
                success: true,
                data: permissions || []
            });
        });
    }
    
    static getPermissions(req, res) {
        const sql = `
            SELECT * FROM permissions 
            WHERE is_active = true 
            ORDER BY category, name
        `;
        
        db.query(sql, (err, permissions) => {
            if (err) {
                console.error('Get permissions error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch permissions'
                });
            }
            
            // Group by category
            const groupedPermissions = permissions.reduce((acc, perm) => {
                if (!acc[perm.category]) {
                    acc[perm.category] = [];
                }
                acc[perm.category].push(perm);
                return acc;
            }, {});
            
            res.json({
                success: true,
                data: {
                    permissions,
                    grouped: groupedPermissions
                }
            });
        });
    }
    
    // ================= AUDIT LOG ================= //
    
    static async getAuditLogs(req, res) {
        const { page = 1, limit = 50, userId, action, resource } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '1=1';
        let params = [];
        
        if (userId) {
            whereClause += ' AND al.user_id = ?';
            params.push(userId);
        }
        
        if (action) {
            whereClause += ' AND al.action = ?';
            params.push(action);
        }
        
        if (resource) {
            whereClause += ' AND al.resource_type = ?';
            params.push(resource);
        }
        
        // Use basic query without location columns for now
        const logsSql = `
            SELECT al.*, al.resource_type as resource, u.name as user_name, u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE ${whereClause}
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        db.query(logsSql, [...params, parseInt(limit), parseInt(offset)], async (err, logs) => {
            if (err) {
                console.error('Get audit logs error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch audit logs'
                });
            }
            
            // Add location data to logs that don't have it
            const IPGeolocationTracker = require('../IPGeolocationTracker');
            const geoTracker = new IPGeolocationTracker();
            
            const enhancedLogs = await Promise.all(logs.map(async (log) => {
                let details;
                try {
                    details = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {});
                } catch {
                    details = {};
                }
                
                // Add location data if not already present and IP address exists
                if (log.ip_address && !log.location_country && !details.location) {
                    try {
                        const locationData = await geoTracker.getLocationData(log.ip_address);
                        details.location = {
                            country: locationData.country,
                            city: locationData.city,
                            region: locationData.region,
                            address: locationData.address,
                            flag: locationData.flag,
                            coordinates: `${locationData.latitude},${locationData.longitude}`,
                            timezone: locationData.timezone,
                            isp: locationData.isp
                        };
                        console.log(`📍 Added location for IP ${log.ip_address}: ${locationData.flag} ${locationData.city}, ${locationData.country}`);
                    } catch (error) {
                        console.log(`⚠️ Could not get location for IP ${log.ip_address}: ${error.message}`);
                    }
                }
                
                return {
                    ...log,
                    details: details
                };
            }));
            
            const countSql = `
                SELECT COUNT(*) as total
                FROM audit_logs al
                WHERE ${whereClause}
            `;
            
            db.query(countSql, params, (countErr, countResult) => {
                if (countErr) {
                    console.error('Count audit logs error:', countErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch audit logs count'
                    });
                }
                
                res.json({
                    success: true,
                    data: {
                        logs: enhancedLogs,
                        pagination: {
                            page: parseInt(page),
                            limit: parseInt(limit),
                            total: countResult[0].total,
                            pages: Math.ceil(countResult[0].total / limit)
                        }
                    }
                });
            });
        });
    }
    
    // ================= SYSTEM STATS ================= //
    
    static getSystemStats(req, res) {
        const userStatsSql = `
            SELECT 
                COUNT(*) as total_users,
                COUNT(*) as active_users,
                0 as inactive_users
            FROM users
        `;
        
        db.query(userStatsSql, (err, userStats) => {
            if (err) {
                console.error('Get user stats error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch system stats'
                });
            }
            
            const roleStatsSql = `
                SELECT r.name, r.display_name, COUNT(u.id) as user_count
                FROM roles r
                LEFT JOIN users u ON r.id = u.role_id
                WHERE r.is_active = true
                GROUP BY r.id
                ORDER BY user_count DESC
            `;
            
            db.query(roleStatsSql, (roleErr, roleStats) => {
                if (roleErr) {
                    console.error('Get role stats error:', roleErr);
                    // Continue with empty role stats
                    roleStats = [];
                }
                
                const permStatsSql = `
                    SELECT category, COUNT(*) as permission_count
                    FROM permissions
                    WHERE is_active = true
                    GROUP BY category
                    ORDER BY permission_count DESC
                `;
                
                db.query(permStatsSql, (permErr, permissionStats) => {
                    if (permErr) {
                        console.error('Get permission stats error:', permErr);
                        // Continue with empty permissions stats
                        permissionStats = [];
                    }
                    
                    const activitySql = `
                        SELECT COUNT(*) as activity_count
                        FROM audit_logs
                        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                    `;
                    
                    db.query(activitySql, (actErr, recentActivity) => {
                        if (actErr) {
                            console.error('Get activity stats error:', actErr);
                            // Continue with zero activity
                            recentActivity = [{ activity_count: 0 }];
                        }
                        
                        res.json({
                            success: true,
                            data: {
                                users: userStats[0],
                                roles: roleStats,
                                permissions: permissionStats,
                                recentActivity: recentActivity[0].activity_count
                            }
                        });
                    });
                });
            });
        });
    }
    
    // ================= HELPER METHODS ================= //
    
    static createAuditLog(userId, action, resource, resourceId, details, callback) {
        const sql = `
            INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Extract IP and user agent from details if provided
        const ipAddress = details?.ip_address || '127.0.0.1';
        const userAgent = details?.user_agent || 'Unknown';
        
        // Clean details (remove IP and user agent to avoid duplication)
        const cleanDetails = { ...details };
        delete cleanDetails.ip_address;
        delete cleanDetails.user_agent;
        
        const values = [
            userId,
            action,
            resource,
            resourceId,
            JSON.stringify(cleanDetails),
            ipAddress,  // FIXED: Now captures IP address
            userAgent   // FIXED: Now captures user agent
        ];
        
        // If no callback provided, return a promise (for async/await usage)
        if (!callback) {
            return new Promise((resolve, reject) => {
                db.query(sql, values, (err, result) => {
                    if (err) {
                        console.error('Create audit log error:', err);
                        reject(err);
                    } else {
                        console.log(`📝 Audit logged: ${action} ${resource} by user ${userId} from ${ipAddress}`);
                        resolve(result);
                    }
                });
            });
        }
        
        // Traditional callback usage
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Create audit log error:', err);
            } else {
                console.log(`📝 Audit logged: ${action} ${resource} by user ${userId} from ${ipAddress}`);
            }
            callback(err, result);
        });
    }
}

module.exports = PermissionsController;
