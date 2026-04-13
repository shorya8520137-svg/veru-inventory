#!/bin/bash

echo "=========================================="
echo "Deploying Review System Fix to Server"
echo "=========================================="
echo ""

# Navigate to project directory
cd ~/inventoryfullstack

echo "1. Checking current branch..."
git branch

echo ""
echo "2. Resetting any local changes..."
git reset --hard HEAD

echo ""
echo "3. Pulling latest code from stocksphere-clean branch..."
git pull origin stocksphere-clean

echo ""
echo "4. Checking if pull was successful..."
if [ $? -eq 0 ]; then
    echo "✅ Code pulled successfully"
else
    echo "❌ Failed to pull code"
    exit 1
fi

echo ""
echo "5. Verifying reviewController.js was updated..."
head -20 ~/inventoryfullstack/controllers/reviewController.js

echo ""
echo "6. Restarting PM2 processes..."
pm2 restart all

echo ""
echo "7. Checking PM2 status..."
pm2 status

echo ""
echo "8. Showing recent logs..."
pm2 logs --lines 20 --nostream

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "The review system should now be working."
echo "Test by creating a review for an existing product."
echo ""
