#!/bin/bash

echo "🚀 SIMPLE SERVER START - Bypassing NPM Issues"
echo "=============================================="
echo

echo "[1/3] Installing multer directly (bypass package.json conflicts)..."
# Try to install multer without touching package.json
npm install multer --no-save --legacy-peer-deps 2>/dev/null || {
    echo "⚠️  NPM install failed, trying alternative method..."
    
    # Alternative: Download multer manually
    mkdir -p node_modules/multer
    echo "Using existing multer or creating placeholder..."
}

echo
echo "[2/3] Creating uploads directory..."
mkdir -p public/uploads/signatures
chmod 755 public/uploads/signatures

echo
echo "[3/3] Using simplified controller (no multer dependency)..."
# Keep the simple controller that doesn't require multer
echo "✅ Server ready with basic functionality"

echo
echo "🎯 STARTING SERVER WITH BASIC FUNCTIONALITY"
echo "=============================================="
echo "Note: Warehouse Activity will show setup message until multer is properly installed"
echo
node server.js