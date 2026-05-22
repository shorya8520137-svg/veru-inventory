#!/bin/bash

echo "🚀 Deploying Warehouse Filter Fix..."
echo ""

cd /home/ubuntu/veru-inventory

echo "📥 Step 1: Pulling latest code from GitHub..."
git pull origin main

echo ""
echo "📦 Step 2: Installing dependencies..."
npm install

echo ""
echo "🔨 Step 3: Building Next.js frontend (CRITICAL - includes PermissionsContext changes)..."
npm run build

echo ""
echo "🔄 Step 4: Restarting PM2 processes..."
pm2 restart all

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Checking PM2 status..."
pm2 status

echo ""
echo "📋 Recent logs:"
pm2 logs --lines 20 --nostream
