const multer = require('multer');
const db = require('../db/connection');

// Simple memory storage for multer (no image upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Avatar upload disabled - not using image uploads
const uploadAvatar = async (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Avatar upload is currently disabled'
    });
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT u.id, u.name, u.email, u.avatar, u.created_at, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `;
        
        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch profile'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = results[0];
            
            res.json({
                success: true,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=007bff&color=ffffff&size=200`,
                    created_at: user.created_at,
                    role_name: user.role_name || 'User'
                }
            });
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};

// Update user profile (simplified - only name and email)
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email } = req.body;

        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        const updateQuery = `
            UPDATE users 
            SET name = ?, email = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        db.query(updateQuery, [name, email, userId], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                
                // Check for duplicate email
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already exists'
                    });
                }
                
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update profile'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// Get user's tickets
const getUserTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT id, ticket_number, title, description, status, priority, category, 
                   created_at, updated_at, resolved_at
            FROM tickets 
            WHERE created_by = ?
            ORDER BY created_at DESC
        `;
        
        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch tickets'
                });
            }

            res.json({
                success: true,
                data: results
            });
        });

    } catch (error) {
        console.error('Tickets fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets'
        });
    }
};

module.exports = {
    upload,
    uploadAvatar,
    getProfile,
    updateProfile,
    getUserTickets
};