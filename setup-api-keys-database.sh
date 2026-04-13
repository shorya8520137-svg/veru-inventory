#!/bin/bash

echo "🔧 Setting up API Keys database tables..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Run the SQL script
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < setup-api-keys-database.sql

if [ $? -eq 0 ]; then
    echo "✅ API Keys database tables created successfully!"
else
    echo "❌ Failed to create API Keys database tables"
    exit 1
fi

echo "🚀 API Keys system is now ready to use!"