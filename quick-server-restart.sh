#!/bin/bash

# QUICK SERVER RESTART SCRIPT
# Run this on your server after pulling the latest code

echo "🚀 Starting server restart process..."

# Step 1: Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Step 2: Check if required files exist
echo "🔍 Checking required files..."
if [ ! -f "IPGeolocationTracker.js" ]; then
    echo "❌ IPGeolocationTracker.js not found!"
    exit 1
fi

if [ ! -f "ProductionEventAuditLogger.js" ]; then
    echo "❌ ProductionEventAuditLogger.js not found!"
    exit 1
fi

echo "✅ All required files found"

# Step 3: Stop existing processes
echo "🛑 Stopping existing Node.js processes..."
pkill node

# Wait a moment for processes to stop
sleep 2

# Step 4: Start the server
echo "🚀 Starting server..."
nohup node server.js > app.log 2>&1 &

# Step 5: Wait and check if server started
sleep 3

# Step 6: Test the server
echo "🧪 Testing server..."
curl -k -s https://52.221.231.85:8443/api/health > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Server started successfully!"
    echo "📊 Server status: RUNNING"
    echo "📝 Logs: tail -f app.log"
else
    echo "❌ Server failed to start"
    echo "📝 Check logs: tail -f app.log"
    exit 1
fi

echo "🎉 Server restart completed!"
echo ""
echo "Next steps:"
echo "1. Test login: curl -k -X POST https://52.221.231.85:8443/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@company.com\",\"password\":\"admin@123\"}'"
echo "2. Check logs: tail -f app.log"
echo "3. Monitor server: ps aux | grep node"