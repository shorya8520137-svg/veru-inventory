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
        const uploadDir = path.join(__dirname, '../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
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

// GET /api/users - Get all users (admin only)
router.get('/', authenticateToken, requirePermission('SYSTEM_USER_MANAGEMENT'), async (req, res) => {
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
                up.profile_image,
                up.phone,
                up.address
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            ORDER BY u.created_at DESC
        `;
        
        const [users] = await db.execute(query);
        
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
    try {
        const userId = req.user.id;
        const { name, email, phone, address } = req.body;
        
        // Start transaction
        await db.beginTransaction();
        
        try {
            // Update user basic info
            await db.execute(
                'UPDATE users SET name = ?, email = ? WHERE id = ?',
                [name, email, userId]
            );
            
            // Handle profile image upload
            let profileImagePath = null;
            if (req.file) {
                profileImagePath = `/uploads/${req.file.filename}`;
                
                // Delete old profile image if exists
                const [existingProfile] = await db.execute(
                    'SELECT profile_image FROM user_profiles WHERE user_id = ?',
                    [userId]
                );
                
                if (existingProfile.length > 0 && existingProfile[0].profile_image) {
                    const oldImagePath = path.join(__dirname, '..', existingProfile[0].profile_image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
            }
            
            // Update or insert user profile
            const [existingProfile] = await db.execute(
                'SELECT id FROM user_profiles WHERE user_id = ?',
                [userId]
            );
            
            if (existingProfile.length > 0) {
                // Update existing profile
                const updateFields = ['phone = ?', 'address = ?'];
                const updateValues = [phone || null, address || null];
                
                if (profileImagePath) {
                    updateFields.push('profile_image = ?');
                    updateValues.push(profileImagePath);
                }
                
                updateValues.push(userId);
                
                await db.execute(
                    `UPDATE user_profiles SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
                    updateValues
                );
            } else {
                // Insert new profile
                await db.execute(
                    'INSERT INTO user_profiles (user_id, profile_image, phone, address) VALUES (?, ?, ?, ?)',
                    [userId, profileImagePath, phone || null, address || null]
                );
            }
            
            // Commit transaction
            await db.commit();
            
            // Fetch updated user data
            const [updatedUser] = await db.execute(`
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.is_active,
                    r.name as role_name,
                    r.display_name as role_display_name,
                    up.profile_image,
                    up.phone,
                    up.address
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.id = ?
            `, [userId]);
            
            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser[0]
            });
            
        } catch (error) {
            await db.rollback();
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
    }
});

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [user] = await db.execute(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.is_active,
                u.created_at,
                r.name as role_name,
                r.display_name as role_display_name,
                up.profile_image,
                up.phone,
                up.address
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = ?
        `, [userId]);
        
        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
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
        const [existingUser] = await db.execute(
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
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const [result] = await db.execute(
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
        const [existingUser] = await db.execute(
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
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }
        
        updateValues.push(userId);
        
        await db.execute(
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
        const [existingUser] = await db.execute(
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
        await db.beginTransaction();
        
        try {
            // Delete user profile and image
            const [profile] = await db.execute(
                'SELECT profile_image FROM user_profiles WHERE user_id = ?',
                [userId]
            );
            
            if (profile.length > 0 && profile[0].profile_image) {
                const imagePath = path.join(__dirname, '..', profile[0].profile_image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            
            await db.execute('DELETE FROM user_profiles WHERE user_id = ?', [userId]);
            await db.execute('DELETE FROM users WHERE id = ?', [userId]);
            
            await db.commit();
            
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
            
        } catch (error) {
            await db.rollback();
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