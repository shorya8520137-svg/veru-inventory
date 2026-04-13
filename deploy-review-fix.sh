#!/bin/bash
# Deploy review controller fix to server

echo "🚀 Deploying review controller fix..."

# Pull latest changes
echo "📥 Pulling latest code from GitHub..."
git pull origin stocksphere-clean

# Install dependencies (if needed)
echo "📦 Checking dependencies..."
npm install

# Restart the backend server
echo "🔄 Restarting backend server..."
pm2 restart backend || pm2 start server.js --name backend

echo "✅ Deployment complete!"
echo ""
echo "📊 Check server status:"
pm2 status

echo ""
echo "📝 View logs:"
echo "pm2 logs backend --lines 50"
