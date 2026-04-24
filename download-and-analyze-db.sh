#!/bin/bash

# DOWNLOAD AND ANALYZE DATABASE FROM SERVER
# Uses SSH to connect to server and download complete database dump

echo "🔌 Connecting to server via SSH..."

# Server details
SERVER_IP="13.212.82.15"
SSH_KEY="C:/pem.pem"
DB_NAME="inventory_db"
DB_USER="root"
DB_PASS="Huny@2024"

# Create local directory for database files
mkdir -p database_analysis
cd database_analysis

echo "📊 Downloading database structure..."

# Download table structures
ssh -i "$SSH_KEY" ubuntu@$SERVER_IP "sudo mysql -u$DB_USER -p$DB_PASS $DB_NAME -e 'SHOW TABLES;'" > tables_list.txt

echo "📋 Tables found:"
cat tables_list.txt

echo "📊 Downloading inventory-related data..."

# Download key inventory tables data
INVENTORY_TABLES=(
    "inventory"
    "stock_batches" 
    "inventory_ledger_base"
    "self_transfer"
    "self_transfer_items"
    "store_inventory"
    "warehouse_dispatch"
    "dispatch_product"
)

for table in "${INVENTORY_TABLES[@]}"; do
    echo "📥 Downloading $table..."
    
    # Get table structure
    ssh -i "$SSH_KEY" ubuntu@$SERVER_IP "sudo mysql -u$DB_USER -p$DB_PASS $DB_NAME -e 'DESCRIBE $table;'" > "${table}_structure.txt" 2>/dev/null
    
    # Get table count
    ssh -i "$SSH_KEY" ubuntu@$SERVER_IP "sudo mysql -u$DB_USER -p$DB_PASS $DB_NAME -e 'SELECT COUNT(*) as count FROM $table;'" > "${table}_count.txt" 2>/dev/null
    
    # Get sample data (first 100 rows)
    ssh -i "$SSH_KEY" ubuntu@$SERVER_IP "sudo mysql -u$DB_USER -p$DB_PASS $DB_NAME -e 'SELECT * FROM $table LIMIT 100;'" > "${table}_sample.txt" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Downloaded $table successfully"
    else
        echo "❌ Failed to download $table"
    fi
done

echo "🔍 Analyzing specific product (2005-999)..."

# Analyze specific product across all tables
ssh -i "$SSH_KEY" ubuntu@$SERVER_IP "sudo mysql -u$DB_USER -p$DB_PASS $DB_NAME -e \"
SELECT 'inventory' as source, code as barcode, warehouse, stock, opening 
FROM inventory WHERE code = '2005-999'
UNION ALL
SELECT 'stock_batches' as source, barcode, warehouse, qty_available as stock, qty_initial as opening
FROM stock_batches WHERE barcode = '2005-999' AND status = 'active'
UNION ALL
SELECT 'store_inventory' as source, barcode, 'STORE' as warehouse, stock, 0 as opening
FROM store_inventory WHERE barcode = '2005-999';
\"" > product_2005-999_analysis.txt

echo "📊 Analyzing inventory ledger for product 2005-999..."

ssh -i "$SSH_KEY" ubuntu@$SERVER_IP "sudo mysql -u$DB_USER -p$DB_PASS $DB_NAME -e \"
SELECT 
    event_time,
    movement_type,
    direction,
    qty,
    location_code,
    reference,
    product_name
FROM inventory_ledger_base 
WHERE barcode = '2005-999'
ORDER BY event_time DESC
LIMIT 50;
\"" > product_2005-999_ledger.txt

echo "🔄 Analyzing self transfers..."

ssh -i "$SSH_KEY" ubuntu@$SERVER_IP "sudo mysql -u$DB_USER -p$DB_PASS $DB_NAME -e \"
SELECT 
    st.id,
    st.transfer_reference,
    st.transfer_type,
    st.source_location,
    st.destination_location,
    st.status,
    st.created_at,
    GROUP_CONCAT(CONCAT(sti.product_name, ':', sti.qty) SEPARATOR '; ') as items
FROM self_transfer st
LEFT JOIN self_transfer_items sti ON st.id = sti.transfer_id
GROUP BY st.id
ORDER BY st.created_at DESC
LIMIT 20;
\"" > self_transfers_analysis.txt

echo "⚠️ Analyzing stock discrepancies..."

ssh -i "$SSH_KEY" ubuntu@$SERVER_IP "sudo mysql -u$DB_USER -p$DB_PASS $DB_NAME -e \"
SELECT 
    i.code as barcode,
    i.warehouse,
    i.stock as inventory_stock,
    COALESCE(SUM(sb.qty_available), 0) as batch_stock,
    (i.stock - COALESCE(SUM(sb.qty_available), 0)) as difference
FROM inventory i
LEFT JOIN stock_batches sb ON i.code = sb.barcode AND i.warehouse = sb.warehouse AND sb.status = 'active'
GROUP BY i.code, i.warehouse, i.stock
HAVING difference != 0
ORDER BY ABS(difference) DESC
LIMIT 50;
\"" > stock_discrepancies.txt

echo "📝 Analyzing product names in store inventory..."

ssh -i "$SSH_KEY" ubuntu@$SERVER_IP "sudo mysql -u$DB_USER -p$DB_PASS $DB_NAME -e \"
SELECT 
    product_name,
    category,
    COUNT(*) as count,
    SUM(stock) as total_stock
FROM store_inventory 
GROUP BY product_name, category
ORDER BY count DESC
LIMIT 50;
\"" > store_inventory_analysis.txt

echo "📊 Creating summary report..."

cat > analysis_summary.txt << EOF
INVENTORY DATABASE ANALYSIS SUMMARY
===================================
Generated: $(date)
Server: $SERVER_IP
Database: $DB_NAME

FILES GENERATED:
- tables_list.txt: All database tables
- *_structure.txt: Table structures
- *_count.txt: Record counts
- *_sample.txt: Sample data
- product_2005-999_analysis.txt: Specific product analysis
- product_2005-999_ledger.txt: Product movement history
- self_transfers_analysis.txt: Self transfer records
- stock_discrepancies.txt: Inventory vs batch stock differences
- store_inventory_analysis.txt: Store inventory summary

NEXT STEPS:
1. Review product_2005-999_analysis.txt for current stock status
2. Check product_2005-999_ledger.txt for movement history
3. Analyze stock_discrepancies.txt for data inconsistencies
4. Review self_transfers_analysis.txt for transfer patterns
5. Check store_inventory_analysis.txt for "Transferred" category issues

EOF

echo "✅ Database analysis complete!"
echo "📁 All files saved in: $(pwd)"
echo "📋 Check analysis_summary.txt for overview"

# Display quick summary
echo ""
echo "🔍 QUICK SUMMARY:"
echo "=================="

if [ -f "product_2005-999_analysis.txt" ]; then
    echo "📊 Product 2005-999 Status:"
    cat product_2005-999_analysis.txt
fi

echo ""
echo "📁 Files created:"
ls -la *.txt