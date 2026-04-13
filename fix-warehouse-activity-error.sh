#!/bin/bash

echo "🔧 Fixing Warehouse Order Activity Error..."
echo

echo "[1/3] Installing missing dependencies..."
npm install multer
if [ $? -ne 0 ]; then
    echo "❌ Failed to install multer"
    exit 1
fi

echo
echo "[2/3] Checking file permissions..."
chmod +x routes/warehouseOrderActivityRoutes.js
chmod +x controllers/warehouseOrderActivityController.js

echo
echo "[3/3] Creating uploads directory..."
mkdir -p public/uploads/signatures
chmod 755 public/uploads/signatures

echo
echo "✅ Fix completed! Now starting server..."
echo
node server.js