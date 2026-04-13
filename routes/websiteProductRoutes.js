const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const websiteProductController = require('../controllers/websiteProductController');
const { authenticateToken } = require('../middleware/auth');
const apiKeysController = require('../controllers/apiKeysController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/bulk-products';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bulk-products-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Public routes (no authentication required) - READ operations
router.get('/products', websiteProductController.getProducts);
router.get('/products/featured', websiteProductController.getFeaturedProducts);
router.get('/products/:id', websiteProductController.getProduct);
router.get('/categories', websiteProductController.getCategories);

// Protected routes (JWT authentication required) - WRITE operations
// Category management routes
router.post('/categories', authenticateToken, websiteProductController.createCategory);
router.put('/categories/:id', authenticateToken, websiteProductController.updateCategory);
router.delete('/categories/:id', authenticateToken, websiteProductController.deleteCategory);

// Product management routes
router.post('/products', authenticateToken, websiteProductController.createProduct);
router.put('/products/:id', authenticateToken, websiteProductController.updateProduct);
router.delete('/products/:id', authenticateToken, websiteProductController.deleteProduct);

// Bulk upload routes
router.post('/products/bulk-upload', authenticateToken, upload.single('csvFile'), websiteProductController.bulkUpload);
router.get('/bulk-upload/:uploadId/status', authenticateToken, websiteProductController.getBulkUploadStatus);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + error.message
        });
    }
    
    if (error.message === 'Only CSV files are allowed') {
        return res.status(400).json({
            success: false,
            message: 'Only CSV files are allowed for bulk upload.'
        });
    }
    
    next(error);
});

module.exports = router;