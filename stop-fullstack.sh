#!/bin/bash

echo "🛑 Stopping Full Stack Application..."

# Kill all node processes
pkill -f "node server.js" 2>/dev/null && echo "✅ Backend stopped"
pkill -f "npm start" 2>/dev/null && echo "✅ Frontend stopped"
pkill -f "next start" 2>/dev/null && echo "✅ Next.js stopped"

sleep 2

echo "🔍 Remaining node processes:"
ps aux | grep node | grep -v grep || echo "No node processes running"

echo "✅ All processes stopped!"