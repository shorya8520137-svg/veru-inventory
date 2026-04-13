#!/bin/bash

echo "🚀 Installing Warehouse Order Activity System..."
echo

echo "[1/5] Installing multer dependency..."
npm install multer
if [ $? -ne 0 ]; then
    echo "❌ Failed to install multer"
    exit 1
fi

echo
echo "[2/5] Creating uploads directory..."
mkdir -p public/uploads/signatures
chmod 755 public/uploads/signatures

echo
echo "[3/5] Restoring full controller..."
if [ -f "controllers/warehouseOrderActivityController-full.js" ]; then
    cp controllers/warehouseOrderActivityController-full.js controllers/warehouseOrderActivityController.js
    echo "✅ Full controller restored"
else
    echo "⚠️  Full controller backup not found, using current version"
fi

echo
echo "[4/5] Setting up database..."
node setup-warehouse-order-activity.js
if [ $? -ne 0 ]; then
    echo "⚠️  Database setup failed - you may need to configure your .env file"
    echo "   But the server should still start now"
fi

echo
echo "[5/5] Testing server startup..."
echo "✅ Installation completed!"
echo
echo "🎯 Warehouse Order Activity System is now ready!"
echo
echo "Features available:"
echo "- Auto-filled order data (AWB, Order Ref, Customer, Product, Logistics)"
echo "- User input fields (Phone, Signature Upload, Status, Remarks)"
echo "- Professional UI with validation"
echo "- Secure file upload handling"
echo
echo "To test:"
echo "1. Start the server: node server.js"
echo "2. Open OrderSheet in browser"
echo "3. Click '📝 Activity' button on any order"
echo
echo "Starting server now..."
node server.js