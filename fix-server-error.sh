#!/bin/bash

echo "========================================="
echo "  Fixing Server Syntax Error"
echo "========================================="
echo ""

# Navigate to project directory
cd ~/inventoryfullstack

echo "1. Checking current branch..."
git branch

echo ""
echo "2. Pulling latest changes from stocksphere-phase-1-complete..."
git fetch origin stocksphere-phase-1-complete
git checkout stocksphere-phase-1-complete
git pull origin stocksphere-phase-1-complete

echo ""
echo "3. Removing corrupted node_modules..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next

echo ""
echo "4. Cleaning npm cache..."
npm cache clean --force

echo ""
echo "5. Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo ""
echo "6. Building the application..."
npm run build

echo ""
echo "7. Restarting PM2..."
pm2 restart all

echo ""
echo "8. Checking PM2 status..."
pm2 list

echo ""
echo "========================================="
echo "  ✅ Fix Complete!"
echo "========================================="
echo ""
echo "Check the server at: https://47.129.8.24:8443"
