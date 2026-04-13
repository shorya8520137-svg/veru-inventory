#!/bin/bash

echo "🎫 Setting up Ticket Management System..."

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "❌ Error: MySQL client not found. Please install mysql-client."
    exit 1
fi

echo ""
echo "1. Setting up database tables..."

# Execute the SQL schema
mysql -h 127.0.0.1 -P 3306 -u inventory_user -p inventory_db < ticket-management-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database tables created successfully!"
else
    echo "❌ Error: Failed to setup database tables"
    echo "Please check your MySQL credentials and database connection."
    exit 1
fi

echo ""
echo "2. Verifying table creation..."

# Check if tables were created
mysql -h 127.0.0.1 -P 3306 -u inventory_user -p inventory_db -e "SHOW TABLES LIKE 'tickets';" -s -N | grep -q "tickets"

if [ $? -eq 0 ]; then
    echo "✅ Tickets table verified"
else
    echo "❌ Warning: Tickets table not found"
fi

mysql -h 127.0.0.1 -P 3306 -u inventory_user -p inventory_db -e "SHOW TABLES LIKE 'ticket_followups';" -s -N | grep -q "ticket_followups"

if [ $? -eq 0 ]; then
    echo "✅ Ticket followups table verified"
else
    echo "❌ Warning: Ticket followups table not found"
fi

echo ""
echo "3. Checking sample data..."

TICKET_COUNT=$(mysql -h 127.0.0.1 -P 3306 -u inventory_user -p inventory_db -e "SELECT COUNT(*) FROM tickets;" -s -N 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Sample data loaded: $TICKET_COUNT tickets found"
else
    echo "⚠️  Could not verify sample data"
fi

echo ""
echo "🎉 Ticket Management System setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Your server should automatically load the new routes (no restart needed)"
echo "2. Navigate to /tickets in your application"
echo "3. Start creating and managing tickets!"
echo ""
echo "🔧 If you encounter issues:"
echo "- Check server logs for any route loading errors"
echo "- Verify the ticket routes are loaded in server.js"
echo "- Test the API endpoints using: node test-ticket-management.js"
echo ""