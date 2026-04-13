#!/bin/bash

echo "========================================"
echo "🚀 DAMAGE & RETURN API TEST RUNNER"
echo "========================================"
echo ""

echo "🌐 API Endpoint: https://54.169.31.95:8443"
echo "👤 Test User: admin@company.com"
echo "🔐 Using JWT Authentication"
echo ""

echo "Starting comprehensive API tests..."
echo ""

# Run the test script
node test-damage-return-apis.js

echo ""
echo "========================================"
echo "Test execution completed!"
echo "Check damage-return-api-test-report.json for detailed results"
echo "========================================"