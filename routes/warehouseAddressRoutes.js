const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

// Get warehouse addresses for PDF generation
router.post('/warehouse-addresses', authenticateToken, async (req, res) => {
    try {
        const { warehouses } = req.body;
        
        if (!warehouses || !Array.isArray(warehouses) || warehouses.length === 0) {
            return res.json({ addresses: {} });
        }
        
        // Create placeholders for the IN clause
        const placeholders = warehouses.map(() => '?').join(',');
        
        const query = `
            SELECT warehouse_code, Warehouse_name, address 
            FROM dispatch_warehouse 
            WHERE warehouse_code IN (${placeholders})
        `;
        
        db.query(query, warehouses, (err, results) => {
            if (err) {
                console.error('Error fetching warehouse addresses:', err);
                return res.status(500).json({ 
                    error: 'Failed to fetch warehouse addresses',
                    addresses: {} 
                });
            }
            
            // Convert results to object with warehouse_code as key
            const addresses = {};
            results.forEach(row => {
                addresses[row.warehouse_code] = {
                    warehouse_name: row.Warehouse_name,
                    address: row.address
                };
            });
            
            res.json({ addresses });
        });
        
    } catch (error) {
        console.error('Warehouse addresses API error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            addresses: {} 
        });
    }
});

module.exports = router;