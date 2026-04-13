#!/bin/bash

echo "Fixing dispatch controller transaction issues..."

# Backup the file
cp controllers/dispatchController.js controllers/dispatchController.js.backup

# Replace all db.rollback with connection.rollback
sed -i 's/db\.rollback(/connection.rollback(/g' controllers/dispatchController.js

# Replace all db.commit with connection.commit  
sed -i 's/db\.commit(/connection.commit(/g' controllers/dispatchController.js

# Replace all db.query with connection.query (only inside transaction functions)
# This is trickier - we need to be selective
# For now, let's create a note that manual review is needed

echo "✅ Basic replacements done"
echo "⚠️  Manual review needed for db.query -> connection.query replacements"
echo "    Only queries inside the transaction should use 'connection'"
echo ""
echo "Backup saved to: controllers/dispatchController.js.backup"
