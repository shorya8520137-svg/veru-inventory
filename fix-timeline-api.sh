#!/bin/bash

echo "🔧 Fixing Timeline API Authentication"
echo "======================================"
echo ""

cd ~/inventoryfullstack

echo "📋 Step 1: Checking current timeline routes..."
echo "Current file content:"
head -20 routes/timelineRoutes.js
echo ""

echo "📥 Step 2: Pulling latest code..."
git pull origin main
echo ""

echo "📋 Step 3: Verifying updated file..."
echo "Updated file content:"
head -20 routes/timelineRoutes.js
echo ""

echo "🔄 Step 4: Stopping PM2..."
pm2 stop backend
sleep 2

echo "🗑️  Step 5: Deleting old PM2 process..."
pm2 delete backend
sleep 1

echo "🚀 Step 6: Starting fresh PM2 process..."
pm2 start server.js --name backend
sleep 2

echo "💾 Step 7: Saving PM2 configuration..."
pm2 save

echo ""
echo "✅ Done! Testing API..."
echo ""

echo "🧪 Testing with curl..."
curl -H "X-API-Key: wk_live_2848739b35b3a50207e5b9e56795ec52e8d5aecfbf74bc41e95dd593af4f1059" \
     https://api.giftgala.in/api/timeline

echo ""
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📝 Recent logs:"
pm2 logs backend --lines 10 --nostream

echo ""
echo "✅ Script complete!"
