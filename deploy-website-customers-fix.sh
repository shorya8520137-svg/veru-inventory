#!/bin/bash

# Website Customers Fix Deployment Script
# Fixes: TypeError: Cannot read properties of undefined (reading 'total')
# Commit: 9b4b8b3

echo "🚀 Deploying Website Customers Fix..."
echo ""

# Navigate to project directory
cd ~/inventoryfullstack || exit 1

echo "📥 Pulling latest code from GitHub..."
git fetch origin
git pull origin stocksphere-phase-1-complete

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi

echo ""
echo "✅ Code updated successfully!"
echo ""

echo "🔄 Restarting PM2 process..."
pm2 restart dashboard-api-1

if [ $? -ne 0 ]; then
    echo "❌ PM2 restart failed!"
    exit 1
fi

echo ""
echo "✅ Server restarted successfully!"
echo ""

echo "📋 Checking server logs..."
sleep 2
pm2 logs dashboard-api-1 --lines 30 --nostream

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the API with:"
echo "   curl -k -H \"Authorization: Bearer YOUR_TOKEN\" https://54.254.184.54:8443/api/website-customers/stats"
echo ""
echo "🌐 Frontend: https://inventoryfullstack-one.vercel.app/website-customers"
