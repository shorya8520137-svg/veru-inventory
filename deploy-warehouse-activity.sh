#!/bin/bash

echo "========================================"
echo "  WAREHOUSE ORDER ACTIVITY DEPLOYMENT"
echo "========================================"
echo

echo "[1/4] Installing dependencies..."
npm install multer
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo
echo "[2/4] Setting up database..."
node setup-warehouse-order-activity.js
if [ $? -ne 0 ]; then
    echo "ERROR: Database setup failed"
    echo "Please check your .env file for correct database credentials"
    exit 1
fi

echo
echo "[3/4] Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed"
    exit 1
fi

echo
echo "[4/4] Starting server..."
echo
echo "========================================"
echo "  DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "========================================"
echo
echo "The Warehouse Order Activity system is now ready!"
echo
echo "Features implemented:"
echo "- Auto-filled order data (AWB, Order Ref, Customer, Product, Logistics)"
echo "- User input fields (Phone, Signature Upload, Status, Remarks)"
echo "- Database integration with warehouse_order_activity table"
echo "- Professional UI with validation and file upload"
echo "- Complete API with authentication and security"
echo
echo "Next steps:"
echo "1. Open your browser and go to the OrderSheet"
echo "2. Click the '📝 Activity' button on any order"
echo "3. Fill the form and test the functionality"
echo
echo "Starting server now..."
echo
node server.js