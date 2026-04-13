#!/bin/bash
# Setup Product Reviews Database Tables

echo "🗄️  Setting up Product Reviews tables..."

# Run the SQL file
sudo mysql inventory_db < create_product_reviews_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Product reviews tables created successfully!"
    echo ""
    echo "📊 Verifying tables..."
    sudo mysql inventory_db -e "SHOW TABLES LIKE '%review%';"
    echo ""
    echo "📈 Checking table structure..."
    sudo mysql inventory_db -e "DESCRIBE product_reviews;"
else
    echo "❌ Failed to create tables. Check the error above."
    exit 1
fi
