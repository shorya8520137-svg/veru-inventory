#!/bin/bash

# =====================================================
# SIMPLE SERVER START SCRIPT
# =====================================================

echo "🚀 STARTING INVENTORY SERVER"
echo "============================"
echo ""

# Stop any existing processes
echo "Stopping existing processes..."
pm2 stop all 2>/dev/null || echo "No PM2 processes running"
pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"

# Kill any node processes on port 8443
echo "Killing processes on port 8443..."
sudo lsof -ti:8443 | xargs sudo kill -9 2>/dev/null || echo "No processes on port 8443"

# Start the server
echo ""
echo "Starting server with PM2..."
pm2 start server.js --name "inventory-server" --watch --ignore-watch="node_modules .next uploads public/uploads"

# Check status
echo ""
echo "📊 Server Status:"
pm2 status

echo ""
echo "📋 Recent Logs:"
pm2 logs inventory-server --lines 5

echo ""
echo "✅ Server started successfully!"
echo ""
echo "🔗 Access your application at:"
echo "- Local: https://localhost:8443"
echo "- Server: https://your-domain:8443"
echo ""
echo "📋 Useful commands:"
echo "- View logs: pm2 logs inventory-server"
echo "- Restart: pm2 restart inventory-server"
echo "- Stop: pm2 stop inventory-server"
echo ""