const express = require('express');
const multer = require('multer');
const ProductController = require('../controllers/productController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Product CRUD
router.get('/', 
    authenticateToken, 
    checkPermission('products.view'), 
    ProductController.getAllProducts
);

router.post('/', 
    authenticateToken, 
    checkPermission('products.create'), 
    ProductController.createProduct
);

router.put('/:id', 
    authenticateToken, 
    checkPermission('products.edit'), 
    ProductController.updateProduct
);

router.delete('/:id', 
    authenticateToken, 
    checkPermission('products.delete'), 
    ProductController.deleteProduct
);

// Barcode Search
router.get('/search/:barcode', 
    authenticateToken, 
    checkPermission('products.view'), 
    ProductController.searchByBarcode
);

// Inventory Management
router.get('/inventory', 
    authenticateToken, 
    checkPermission('inventory.view'), 
    ProductController.getInventory
);

router.get('/inventory/by-warehouse/:warehouse', 
    authenticateToken, 
    checkPermission('inventory.view'), 
    ProductController.getInventoryByWarehouse
);

router.get('/inventory/export', 
    authenticateToken, 
    checkPermission('inventory.export'), 
    ProductController.exportInventory
);

router.post('/transfer', 
    authenticateToken, 
    checkPermission('inventory.transfer'), 
    ProductController.transferProduct
);

router.post('/bulk/transfer', 
    authenticateToken, 
    checkPermission('inventory.transfer'), 
    ProductController.bulkTransferProducts
);

router.get('/inventory/:barcode', 
    authenticateToken, 
    checkPermission('inventory.view'), 
    ProductController.getProductInventory
);

// Bulk Import
router.post('/bulk/import', 
    authenticateToken, 
    checkPermission('products.bulk_import'), 
    upload.single('file'), 
    ProductController.bulkImport
);

router.post('/bulk/import/progress', 
    authenticateToken, 
    checkPermission('products.bulk_import'), 
    upload.single('file'), 
    ProductController.bulkImportWithProgress
);

// Categories
router.get('/categories/all', 
    authenticateToken, 
    checkPermission('products.categories'), 
    ProductController.getCategories
);

router.post('/categories', 
    authenticateToken, 
    checkPermission('products.categories'), 
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
