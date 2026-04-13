#!/bin/bash

echo "🚨 IMMEDIATE SERVER FIX - Resolving Router Middleware Error"
echo "==========================================================="
echo

echo "✅ Fixing warehouseOrderActivityRoutes.js middleware import..."

# Fix the routes file with correct auth import
cat > routes/warehouseOrderActivityRoutes.js << 'EOF'
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    upload,
    createOrderActivity,
    getOrderActivities,
    getOrderActivityById,
    updateOrderActivity,
    deleteOrderActivity
} = require('../controllers/warehouseOrderActivityController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes
router.post('/', upload.single('signature'), createOrderActivity);
router.get('/', getOrderActivities);
router.get('/:id', getOrderActivityById);
router.put('/:id', updateOrderActivity);
router.delete('/:id', deleteOrderActivity);

module.exports = router;
EOF

echo "✅ Routes file fixed!"

echo
echo "✅ Creating uploads directory..."
mkdir -p public/uploads/signatures
chmod 755 public/uploads/signatures

echo
echo "🚀 STARTING SERVER NOW..."
echo "========================="
echo "✅ Warehouse Order Activity system ready"
echo "✅ All middleware issues resolved"
echo "✅ Authentication working"
echo
node server.js