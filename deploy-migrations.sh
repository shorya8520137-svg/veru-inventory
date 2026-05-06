#!/bin/bash
# Deploy and run migrations on AWS EC2 server

SERVER="root@13.212.202.137"
REMOTE_DIR="/root/inventory-migrations"

echo "📦 Preparing migration package..."

# Create temporary directory
mkdir -p /tmp/migrations-package
cp -r migrations /tmp/migrations-package/
cp run-migrations.js /tmp/migrations-package/
cp package.json /tmp/migrations-package/
cp .env.production /tmp/migrations-package/.env.local

echo "📤 Uploading to server..."
ssh $SERVER "mkdir -p $REMOTE_DIR"
scp -r /tmp/migrations-package/* $SERVER:$REMOTE_DIR/

echo "🔧 Installing dependencies on server..."
ssh $SERVER "cd $REMOTE_DIR && npm install mysql2 dotenv"

echo "🚀 Running migrations on server..."
ssh $SERVER "cd $REMOTE_DIR && node run-migrations.js"

echo "✅ Migration deployment complete!"
echo ""
echo "To verify, run:"
echo "ssh $SERVER 'mysql -u inventory_user -pStrongPass@123 inventory_db -e \"SHOW TABLES LIKE \\\"%permission%\\\"\"'"

# Cleanup
rm -rf /tmp/migrations-package
