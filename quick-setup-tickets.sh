#!/bin/bash

echo "🚀 Quick Ticket Management Setup"

# Make scripts executable
chmod +x setup-ticket-management.sh
chmod +x setup-tickets-direct.sh

echo "✅ Scripts made executable"

# Run the direct setup
echo ""
echo "Running database setup..."
./setup-tickets-direct.sh

echo ""
echo "🎫 Ticket Management System is ready!"
echo ""
echo "🌐 Access your ticket system at: https://your-domain/tickets"
echo "📱 Or test the API with: node test-ticket-management.js"