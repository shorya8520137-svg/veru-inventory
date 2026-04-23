const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

/**
 * CLEANUP ROUTES
 * Clean database and fix product names
 */

// POST /api/cleanup/store-inventory - Clean store inventory and fix product names
router.post('/store-inventory', authenticateToken, (req, res) => {
    try {
        console.log('🧹 Starting store inventory cleanup...');

        // Step 1: Clear store inventory
        db.query('DELETE FROM store_inventory', (err) => {
            if (err) {
                console.error('Error clearing store inventory:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to clear store inventory',
                    error: err.message
                });
            }

            console.log('✅ Store inventory cleared');

            // Step 2: Update warehouse product names
            const productUpdates = [
                { code: '2025-885', name: 'Samsung Galaxy S24' },
                { code: '2460-3499', name: 'iPhone 15 Pro Max' },
                { code: '493-11471', name: 'MacBook Air M3' },
                { code: '638-30500', name: 'Dell XPS 13' }
            ];

            let updatesCompleted = 0;
            
            productUpdates.forEach(product => {
                db.query('UPDATE inventory SET product = ? WHERE code = ?', [product.name, product.code], (err) => {
                    if (err) {
                        console.error(`Error updating product ${product.code}:`, err);
                    } else {
                        console.log(`✅ Updated ${product.code} to ${product.name}`);
                    }
                    
                    updatesCompleted++;
                    
                    if (updatesCompleted === productUpdates.length) {
                        // Step 3: Clean test data
                        db.query('DELETE FROM bills WHERE invoice_number LIKE "TRF_%"', (err) => {
                            if (err) console.error('Error cleaning bills:', err);
                            
                            db.query('DELETE FROM self_transfer WHERE transfer_reference LIKE "TEST_%"', (err) => {
                                if (err) console.error('Error cleaning transfers:', err);
                                
                                // Step 4: Get final status
                                db.query('SELECT product, code, stock FROM inventory WHERE stock > 0', (err, warehouseProducts) => {
                                    if (err) {
                                        console.error('Error fetching warehouse products:', err);
                                        warehouseProducts = [];
                                    }
                                    
                                    db.query('SELECT COUNT(*) as count FROM store_inventory', (err, storeCount) => {
                                        if (err) {
                                            console.error('Error counting store inventory:', err);
                                            storeCount = [{ count: 0 }];
                                        }
                                        
                                        console.log('🎉 Cleanup completed successfully!');
                                        
                                        res.json({
                                            success: true,
                                            message: 'Store inventory cleaned and product names updated',
                                            data: {
                                                warehouseProducts: warehouseProducts,
                                                storeInventoryCount: storeCount[0].count,
                                                updatedProducts: productUpdates.length
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    }
                });
            });
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during cleanup',
            error: error.message
        });
    }
});

// GET /api/cleanup/status - Get current database status
router.get('/status', authenticateToken, (req, res) => {
    try {
        db.query('SELECT product, code, stock FROM inventory WHERE stock > 0', (err, warehouseProducts) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch warehouse products',
                    error: err.message
                });
            }
            
            db.query('SELECT COUNT(*) as count FROM store_inventory', (err, storeCount) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to count store inventory',
                        error: err.message
                    });
                }
                
                res.json({
                    success: true,
                    data: {
                        warehouseProducts: warehouseProducts,
                        storeInventoryCount: storeCount[0].count
                    }
                });
            });
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;