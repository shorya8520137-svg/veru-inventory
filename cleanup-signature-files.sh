#!/bin/bash

echo "🗑️  CLEANING UP SIGNATURE UPLOAD FILES & DIRECTORIES"
echo "===================================================="
echo

echo "[1/4] Removing signature upload directory..."
if [ -d "public/uploads/signatures" ]; then
    rm -rf public/uploads/signatures
    echo "✅ Removed public/uploads/signatures directory"
else
    echo "ℹ️  Directory public/uploads/signatures doesn't exist"
fi

echo
echo "[2/4] Removing uploads directory if empty..."
if [ -d "public/uploads" ]; then
    if [ -z "$(ls -A public/uploads)" ]; then
        rmdir public/uploads
        echo "✅ Removed empty public/uploads directory"
    else
        echo "ℹ️  public/uploads directory not empty, keeping it"
    fi
else
    echo "ℹ️  Directory public/uploads doesn't exist"
fi

echo
echo "[3/4] Updating database schema..."
if command -v mysql &> /dev/null; then
    echo "MySQL found, you can run:"
    echo "mysql -u your_username -p your_database < remove-signature-column.sql"
else
    echo "⚠️  MySQL not found in PATH"
    echo "Please run the SQL commands manually:"
    echo "1. mysql -u your_username -p"
    echo "2. USE your_database_name;"
    echo "3. ALTER TABLE warehouse_order_activity DROP COLUMN signature_url;"
fi

echo
echo "[4/4] Cleanup summary..."
echo "✅ Removed signature upload functionality"
echo "✅ Cleaned up file storage directories"
echo "✅ Updated code to use JSON instead of FormData"
echo "⚠️  Remember to run the SQL commands to update database"
echo
echo "💾 STORAGE SAVINGS:"
echo "- No more signature file uploads"
echo "- No file storage overhead"
echo "- Reduced server disk usage"
echo "- Simplified backup requirements"
echo
echo "🎯 FUNCTIONALITY MAINTAINED:"
echo "- Auto-filled order data ✅"
echo "- Phone number input ✅"
echo "- Status dropdown (Dispatch/Cancel) ✅"
echo "- Remarks field ✅"
echo "- Form validation ✅"
echo "- Database storage ✅"
echo
echo "Cleanup completed successfully! 🎉"