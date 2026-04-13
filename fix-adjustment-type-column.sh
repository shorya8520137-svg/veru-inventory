#!/bin/bash

echo "🔧 Fixing inventory_adjustments.adjustment_type column schema..."
echo "This will expand the column to support manual stock update types"
echo ""

# Run the fix
node fix-adjustment-type-column.js

echo ""
echo "✅ Schema fix completed!"
echo "You can now test the manual stock update feature."