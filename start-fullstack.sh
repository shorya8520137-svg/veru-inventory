#!/bin/bash

echo "🚀 Starting Full Stack Application..."

cd ~/inventoryfullstack

# Kill existing processes
echo "🛑 Stopping existing processes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
sleep 2

# Start backend
echo "🔧 Starting backend on port 5000..."
nohup node server.js > backend.log 2>&1 &
echo "Backend PID: $!"

# Wait for backend
sleep 3

# Start frontend
echo "🌐 Starting frontend on port 3000..."
nohup npm start > frontend.log 2>&1 &
echo "Frontend PID: $!"

# Wait for frontend
sleep 5

echo ""
echo "✅ Applications started!"
echo "🌐 Access: https://13.212.182.78.nip.io"
echo "📋 Backend logs: tail -f backend.log"
echo "📋 Frontend logs: tail -f frontend.log"
echo "🔍 Check status: ps aux | grep node"