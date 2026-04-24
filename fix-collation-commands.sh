#!/bin/bash
echo "🔧 Fixing MySQL collation issue for store inventory..."

# Fix the collation issue
sudo mysql -e "
USE inventory_db;
ALTER TABLE store_inventory MODIFY barcode VARCHAR(255) COLLATE utf8mb4_unicode_ci;
SELECT 'Collation fixed successfully' as result;
"

echo "✅ Collation fix complete!"

# Pull latest code
echo "📥 Pulling latest code..."
cd /home/ubuntu/inventoryfullstack
git pull origin main

# Restart server
echo "🔄 Restarting server..."
pm2 restart all

echo "🎉 All done! Store inventory API should now work."