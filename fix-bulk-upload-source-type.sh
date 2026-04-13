#!/bin/bash

# Fix bulk upload source_type column error
# Run this on the server to fix the database schema

echo "=========================================="
echo "Fixing stock_batches.source_type column"
echo "=========================================="

# Database credentials (update if needed)
DB_HOST="localhost"
DB_USER="root"
DB_NAME="inventory_db"

echo ""
echo "Executing SQL fix..."
sudo mysql -u $DB_USER $DB_NAME < fix-bulk-upload-source-type.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: source_type column fixed!"
    echo ""
    echo "Verifying the fix..."
    sudo mysql -u $DB_USER $DB_NAME -e "DESCRIBE stock_batches;" | grep source_type
    echo ""
    echo "=========================================="
    echo "Fix complete! You can now:"
    echo "1. Restart the server: pm2 restart all"
    echo "2. Test bulk upload functionality"
    echo "=========================================="
else
    echo ""
    echo "❌ ERROR: Failed to execute SQL fix"
    echo "Please check the error messages above"
    exit 1
fi
