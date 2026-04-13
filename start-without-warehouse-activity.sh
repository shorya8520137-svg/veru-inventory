#!/bin/bash

echo "🚀 STARTING SERVER WITHOUT WAREHOUSE ACTIVITY (TEMPORARY)"
echo "========================================================="
echo

echo "✅ Temporarily commenting out warehouse activity routes in server.js..."

# Create backup of server.js
cp server.js server.js.backup

# Comment out the warehouse activity route line
sed -i 's|app.use(\x27/api/warehouse-order-activity\x27, require(\x27./routes/warehouseOrderActivityRoutes\x27));|// app.use(\x27/api/warehouse-order-activity\x27, require(\x27./routes/warehouseOrderActivityRoutes\x27)); // TEMPORARILY DISABLED|g' server.js

echo "✅ Warehouse activity routes temporarily disabled"
echo "✅ Server will start without this feature"
echo "✅ All other functionality remains intact"
echo

echo "🚀 STARTING SERVER..."
echo "===================="
node server.js