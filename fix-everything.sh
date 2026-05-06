#!/bin/bash

echo "=========================================="
echo "COMPLETE SERVER FIX SCRIPT"
echo "=========================================="
echo ""

# 1. Check what's listening on port 5000
echo "1. Checking port 5000..."
sudo netstat -tlnp | grep :5000
echo ""

# 2. Test backend locally
echo "2. Testing backend on localhost..."
curl -s http://localhost:5000/api/health || echo "FAILED: Backend not responding on localhost"
echo ""

# 3. Test backend on 127.0.0.1
echo "3. Testing backend on 127.0.0.1..."
curl -s http://127.0.0.1:5000/api/health || echo "FAILED: Backend not responding on 127.0.0.1"
echo ""

# 4. Check Nginx error logs
echo "4. Checking Nginx error logs..."
sudo tail -20 /var/log/nginx/error.log
echo ""

# 5. Check Nginx config
echo "5. Checking Nginx config..."
sudo nginx -T | grep -A 30 "server_name api.giftgala.in"
echo ""

# 6. Restart everything
echo "6. Restarting services..."

# Kill existing node process
echo "   - Killing existing Node.js processes..."
pkill -f 'node server.js'
sleep 2

# Start MariaDB
echo "   - Starting MariaDB..."
sudo systemctl start mariadb
sudo systemctl status mariadb --no-pager | head -5

# Start backend
echo "   - Starting backend..."
cd ~/inventory-app
nohup node server.js > logs/server.log 2>&1 &
sleep 5

# Check if backend started
echo "   - Checking if backend started..."
ps aux | grep 'node server.js' | grep -v grep

# Restart Nginx
echo "   - Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "7. Testing after restart..."
echo "   - Testing localhost:5000..."
curl -s http://localhost:5000/api/health && echo "✅ Backend working on localhost" || echo "❌ Backend NOT working on localhost"

echo "   - Testing HTTPS..."
curl -s https://api.giftgala.in/api/health && echo "✅ HTTPS working" || echo "❌ HTTPS NOT working"

echo ""
echo "8. Checking backend logs..."
tail -30 ~/inventory-app/logs/server.log

echo ""
echo "=========================================="
echo "DIAGNOSTICS COMPLETE"
echo "=========================================="
