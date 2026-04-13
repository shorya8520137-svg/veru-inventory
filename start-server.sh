#!/bin/bash

echo "🚀 Starting Inventory Fullstack Server"
echo "====================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the project root directory
cd "$SCRIPT_DIR"

echo "📍 Working directory: $(pwd)"

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found in current directory"
    echo "   Make sure you're running this script from the project root"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Check if emergency fix is needed
if [ -f "emergency-fix-api-key.js" ]; then
    echo "🔧 Running emergency API key fix..."
    node emergency-fix-api-key.js
fi

# Start the server
echo "🚀 Starting server..."
echo "   Server will be available at: http://localhost:3001"
echo "   API endpoint: https://54.169.31.95:8443/api/website/orders"
echo "   Press Ctrl+C to stop"
echo ""

node server.js