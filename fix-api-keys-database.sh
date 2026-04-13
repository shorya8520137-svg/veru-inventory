#!/bin/bash

echo "🔧 Creating API Keys table..."

# You need to run this command on your server with proper MySQL credentials
echo "Run this command on your server:"
echo ""
echo "mysql -u root -p inventory_db < create-api-keys-table.sql"
echo ""
echo "Or connect to MySQL and run:"
echo ""
echo "mysql -u root -p"
echo "USE inventory_db;"
echo ""
cat create-api-keys-table.sql
echo ""
echo "After creating the table, restart your Node.js server:"
echo "pm2 restart all"