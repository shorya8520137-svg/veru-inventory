#!/bin/bash

# Test warehouse API endpoints
API_BASE="https://api.giftgala.in"

echo "🧪 Testing Warehouse Management APIs"
echo "API Base: $API_BASE"
echo ""

# Note: You need to replace TOKEN with a valid JWT token from the application
# Get a token by logging in to the application first

echo "1️⃣  Testing GET /api/warehouse-management/warehouses"
curl -s -X GET "$API_BASE/api/warehouse-management/warehouses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'
echo ""

echo "2️⃣  Testing GET /api/warehouse-management/stores"
curl -s -X GET "$API_BASE/api/warehouse-management/stores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'
echo ""

echo "✅ Tests completed!"
