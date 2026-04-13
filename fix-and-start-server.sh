#!/bin/bash

echo "🔧 Fixing API Key Issue and Starting Server"
echo "==========================================="

# Make sure we're in the right directory
cd /home/ubuntu/inventoryfullstack

echo "📍 Current directory: $(pwd)"

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Run emergency fix
echo "🚨 Running emergency fix..."
node emergency-fix-api-key.js

# Start the server
echo "🚀 Starting server..."
echo "Press Ctrl+C to stop the server"
echo ""
node server.js