#!/bin/bash

echo "🚨 EMERGENCY SERVER FIX - Resolving Node.js & NPM Issues"
echo "========================================================="
echo

echo "🔍 Current environment:"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo

echo "[1/6] Cleaning NPM cache and node_modules..."
rm -rf node_modules
rm -f package-lock.json
npm cache clean --force

echo
echo "[2/6] Installing only essential backend dependencies..."
# Install only what we need for the server to run
npm install --no-package-lock --legacy-peer-deps express mysql2 cors dotenv jsonwebtoken bcryptjs multer

echo
echo "[3/6] Creating minimal package.json for server..."
cat > package-server.json << 'EOF'
{
  "name": "inventory-server",
  "version": "1.0.0",
  "description": "Inventory Management Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5"
  }
}
EOF

echo
echo "[4/6] Installing server dependencies with minimal package..."
npm install --package-lock=false --no-save express mysql2 cors dotenv jsonwebtoken bcryptjs multer

echo
echo "[5/6] Creating uploads directory..."
mkdir -p public/uploads/signatures
chmod 755 public/uploads/signatures

echo
echo "[6/6] Restoring full warehouse activity controller..."
if [ -f "controllers/warehouseOrderActivityController-full.js" ]; then
    cp controllers/warehouseOrderActivityController-full.js controllers/warehouseOrderActivityController.js
    echo "✅ Full controller restored"
else
    echo "⚠️  Using current controller"
fi

echo
echo "🎯 EMERGENCY FIX COMPLETED!"
echo
echo "✅ Server should now start successfully with:"
echo "   - All essential dependencies installed"
echo "   - Warehouse Order Activity system ready"
echo "   - File upload functionality working"
echo
echo "🚀 Starting server now..."
echo "========================================================="
node server.js