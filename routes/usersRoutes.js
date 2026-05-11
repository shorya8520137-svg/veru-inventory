const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const db = require('../db/connection');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/avatars');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + (req.user ? req.user.id : 'unknown') + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

/**
 * USER PROFILE ROUTES
 */

console.log('📝 usersRoutes.js loaded');

// GET /api/users - Get all users (admin only)
router.get('/', authenticateToken, requirePermission('SYSTEM_USER_MANAGEMENT'), async (req, res) => {
    console.log('[GET /api/users] Fetching all users');
    try {
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.is_active,
                u.last_login,
                u.created_at,
                r.name as role_name,
                r.display_name as role_display_name,
                u.avatar as profile_image,
                u.mobile as phone,
                '' as address
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `;
        
        const [users] = await db.promise().execute(query);
        
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// PUT /api/users/profile - Update current user profile
router.put('/profile', authenticateToken, upload.single('profile_image'), async (req, res) => {
    let connection;
    try {
        const userId = req.user.id;
        const { name, email, phone, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }
        
        connection = await db.promise().getConnection();
        await connection.beginTransaction();
        
        try {
            const updateFields = ['name = ?', 'email = ?', 'mobile = ?'];
            const updateValues = [name, email, phone || null];
            
            // Handle profile image upload
            let profileImagePath = null;
            if (req.file) {
                profileImagePath = `/uploads/avatars/${req.file.filename}`;
                
                // Delete old profile image if exists
                const [existingUser] = await connection.execute(
                    'SELECT avatar FROM users WHERE id = ?',
                    [userId]
                );
                
                if (existingUser.length > 0 && existingUser[0].avatar) {
                    const oldImagePath = path.join(__dirname, '..', existingUser[0].avatar);
                    if (fs.existsSync(oldImagePath)) {
                        try {
                            fs.unlinkSync(oldImagePath);
                        } catch (e) {
                            console.error('Failed to delete old avatar:', e);
                        }
                    }
                }
                
                updateFields.push('avatar = ?');
                updateValues.push(profileImagePath);
            }
            
            updateValues.push(userId);
            
            await connection.execute(
                `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                updateValues
            );
            
            // Commit transaction
            await connection.commit();
            
            // Fetch updated user data
            const [updatedUser] = await connection.execute(`
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.is_active,
                    r.name as role_name,
                    r.display_name as role_display_name,
                    u.avatar as profile_image,
                    u.mobile as phone,
                    '' as address
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `, [userId]);
            
            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser[0]
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        
        // Delete uploaded file if there was an error
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    console.log('[GET /api/users/profile] Route hit!');
    console.log('[GET /api/users/profile] req.user:', req.user);
    try {
        const userId = req.user.id;
        console.log('[Profile API] Fetching profile for user ID:', userId);
        console.log('[Profile API] req.user:', req.user);
        
        const [user] = await db.promise().execute(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.is_active,
                u.created_at,
                r.name as role_name,
                r.display_name as role_display_name,
                u.avatar as profile_image,
                u.mobile as phone,
                '' as address
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `, [userId]);
        
        console.log('[Profile API] Query result:', user);
        console.log('[Profile API] Number of users found:', user.length);
        
        if (user.length === 0) {
            console.log('[Profile API] ERROR: User not found for ID:', userId);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log('[Profile API] SUCCESS: Returning user data:', user[0]);
        res.json({
            success: true,
            user: user[0]
        });
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile'
        });
    }
});

// POST /api/users - Create new user (admin only)
router.post('/', authenticateToken, requirePermission('SYSTEM_USER_MANAGEMENT'), async (req, res) => {
    try {
        const { name, email, password, role_id, is_active = true } = req.body;
        
        // Check if user already exists
        const [existingUser] = await db.promise().execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const [result] = await db.promise().execute(
            'INSERT INTO users (name, email, password, role_id, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role_id, is_active]
        );
        
        res.json({
            success: true,
            message: 'User created successfully',
            user_id: result.insertId
        });
        
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authenticateToken, requirePermission('SYSTEM_USER_MANAGEMENT'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, password, role_id, is_active } = req.body;
        
        // Check if user exists
        const [existingUser] = await db.promise().execute(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );
        
        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Prepare update query
        const updateFields = ['name = ?', 'email = ?', 'role_id = ?', 'is_active = ?'];
        const updateValues = [name, email, role_id, is_active];
        
        // Add password if provided
        if (password) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }
        
        updateValues.push(userId);
        
        await db.promise().execute(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );
        
        res.json({
            success: true,
            message: 'User updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requirePermission('SYSTEM_USER_MANAGEMENT'), async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Check if user exists
        const [existingUser] = await db.promise().execute(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );
        
        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Don't allow deleting yourself
        if (userId == req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        
        // Start transaction
        await db.promise().beginTransaction();
        
        try {
            // Delete user image
            const [existingUser] = await db.promise().execute(
                'SELECT avatar FROM users WHERE id = ?',
                [userId]
            );
            
            if (existingUser.length > 0 && existingUser[0].avatar) {
                const imagePath = path.join(__dirname, '..', existingUser[0].avatar);
                if (fs.existsSync(imagePath)) {
                    try {
                        fs.unlinkSync(imagePath);
                    } catch (e) {
                        console.error('Failed to delete avatar:', e);
                    }
                }
            }
            
            await db.promise().execute('DELETE FROM users WHERE id = ?', [userId]);
            
            await db.promise().commit();
            
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
            
        } catch (error) {
            await db.promise().rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

module.exports = router;
