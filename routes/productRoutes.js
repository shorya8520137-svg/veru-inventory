const express = require('express');
const multer = require('multer');
const ProductController = require('../controllers/productController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Product CRUD
router.get('/', 
    authenticateToken, 
    ProductController.getAllProducts
);

router.post('/', 
    authenticateToken, 
    ProductController.createProduct
);

router.put('/:id', 
    authenticateToken, 
    ProductController.updateProduct
);

router.delete('/:id', 
    authenticateToken, 
    ProductController.deleteProduct
);

// Barcode Search
router.get('/search/:barcode', 
    authenticateToken, 
    ProductController.searchByBarcode
);

// Inventory Management
router.get('/inventory', 
    authenticateToken, 
    ProductController.getInventory
);

router.get('/inventory/by-warehouse/:warehouse', 
    authenticateToken, 
    ProductController.getInventoryByWarehouse
);

router.get('/inventory/export', 
    authenticateToken, 
    ProductController.exportInventory
);

router.post('/transfer', 
    authenticateToken, 
    ProductController.transferProduct
);

router.post('/bulk/transfer', 
    authenticateToken, 
    ProductController.bulkTransferProducts
);

router.get('/inventory/:barcode', 
    authenticateToken, 
    ProductController.getProductInventory
);

// Bulk Import
router.post('/bulk/import', 
    authenticateToken, 
    upload.single('file'), 
    ProductController.bulkImport
);

router.post('/bulk/import/progress', 
    authenticateToken, 
    upload.single('file'), 
    ProductController.bulkImportWithProgress
);

// Categories
router.get('/categories/all', 
    authenticateToken, 
    ProductController.getCategories
);

router.post('/categories', 
    authenticateToken, 
    ProductController.createCategory
);

// Locations (public endpoints for dropdowns)
router.get('/warehouses', 
    authenticateToken, 
    ProductController.getWarehouses
);

router.get('/stores', 
    authenticateToken, 
    ProductController.getStores
);

module.exports = router;
