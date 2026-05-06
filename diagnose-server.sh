#!/bin/bash

echo "=========================================="
echo "SERVER DIAGNOSTICS"
echo "=========================================="
echo ""

echo "1. Checking if Node.js server is running..."
ps aux | grep 'node server.js' | grep -v grep
echo ""

echo "2. Checking which ports are listening..."
sudo netstat -tlnp | grep ':5000'
echo ""

echo "3. Checking Ubuntu firewall (ufw) status..."
sudo ufw status
echo ""

echo "4. Testing localhost connection..."
curl -s http://localhost:5000/api/health
echo ""

echo "5. Testing 0.0.0.0 connection..."
curl -s http://0.0.0.0:5000/api/health
echo ""

echo "6. Checking server logs (last 20 lines)..."
tail -20 ~/inventory-app/logs/server.log
echo ""

echo "=========================================="
echo "DIAGNOSTICS COMPLETE"
echo "=========================================="
