#!/bin/bash

echo "🚀 Deploying bulk upload transaction fix..."

cd /home/ubuntu/veru-inventory

echo "📥 Pulling latest code..."
git pull origin main

echo "🔄 Restarting PM2..."
pm2 restart all

echo "✅ Deployment complete!"
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔍 Recent logs:"
pm2 logs --lines 20 --nostream
