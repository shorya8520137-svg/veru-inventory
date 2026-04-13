#!/bin/bash

# Server-side script to restart Node.js and test API
# Run this directly on the server: bash server-restart-and-test.sh

PROJECT_PATH="/home/ubuntu/inventoryfullstack"
API_PORT="5000"

echo "========================================"
echo "Server Restart and API Test"
echo "========================================"

# Step 1: Kill existing Node process
echo ""
echo "[1/3] Stopping existing Node.js server..."
pkill -f "node server.js" || true
sleep 2
echo "✓ Node.js stopped"

# Step 2: Start Node.js server
echo ""
echo "[2/3] Starting Node.js server..."
cd $PROJECT_PATH
nohup node server.js > server.log 2>&1 &
sleep 4
echo "✓ Node.js started"

# Step 3: Test API
echo ""
echo "[3/3] Testing API response..."
sleep 2

# Try to get products from API
API_RESPONSE=$(curl -s "http://localhost:${API_PORT}/api/website/products?limit=1")

echo ""
echo "API Response:"
echo "$API_RESPONSE" | jq '.' 2>/dev/null || echo "$API_RESPONSE"

# Check if additional_images is in response
if echo "$API_RESPONSE" | grep -q "additional_images"; then
    echo ""
    echo "✓ SUCCESS: additional_images field is present in API response!"
else
    echo ""
    echo "✗ WARNING: additional_images field NOT found in API response"
fi

echo ""
echo "========================================"
echo "Server restart complete!"
echo "========================================"
echo ""
echo "Check server logs:"
echo "  tail -f $PROJECT_PATH/server.log"
echo ""
