@echo off
REM DOWNLOAD AND ANALYZE DATABASE FROM SERVER (Windows Version)
REM Uses SSH to connect to server and download complete database dump

echo 🔌 Connecting to server via SSH...

REM Server details
set SERVER_IP=13.212.82.15
set SSH_KEY=C:\pem.pem
set DB_NAME=inventory_db
set DB_USER=root
set DB_PASS=Huny@2024

REM Create local directory for database files
if not exist database_analysis mkdir database_analysis
cd database_analysis

echo 📊 Downloading database structure...

REM Download table structures
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SHOW TABLES;'" > tables_list.txt

echo 📋 Tables found:
type tables_list.txt

echo 📊 Downloading inventory table data...

REM Download inventory table
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'DESCRIBE inventory;'" > inventory_structure.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT COUNT(*) as count FROM inventory;'" > inventory_count.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT * FROM inventory LIMIT 100;'" > inventory_sample.txt

echo 📦 Downloading stock_batches data...

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'DESCRIBE stock_batches;'" > stock_batches_structure.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT COUNT(*) as count FROM stock_batches;'" > stock_batches_count.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT * FROM stock_batches WHERE status = \"active\" LIMIT 100;'" > stock_batches_sample.txt

echo 📝 Downloading inventory_ledger_base data...

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'DESCRIBE inventory_ledger_base;'" > inventory_ledger_base_structure.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT COUNT(*) as count FROM inventory_ledger_base;'" > inventory_ledger_base_count.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT * FROM inventory_ledger_base ORDER BY event_time DESC LIMIT 100;'" > inventory_ledger_base_sample.txt

echo 🔄 Downloading self_transfer data...

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'DESCRIBE self_transfer;'" > self_transfer_structure.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT COUNT(*) as count FROM self_transfer;'" > self_transfer_count.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT * FROM self_transfer ORDER BY created_at DESC LIMIT 50;'" > self_transfer_sample.txt

echo 📋 Downloading self_transfer_items data...

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'DESCRIBE self_transfer_items;'" > self_transfer_items_structure.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT COUNT(*) as count FROM self_transfer_items;'" > self_transfer_items_count.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT * FROM self_transfer_items LIMIT 100;'" > self_transfer_items_sample.txt

echo 🏪 Downloading store_inventory data...

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'DESCRIBE store_inventory;'" > store_inventory_structure.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT COUNT(*) as count FROM store_inventory;'" > store_inventory_count.txt
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e 'SELECT * FROM store_inventory ORDER BY created_at DESC LIMIT 100;'" > store_inventory_sample.txt

echo 🔍 Analyzing specific product (2005-999)...

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e \"SELECT 'inventory' as source, code as barcode, warehouse, stock, opening FROM inventory WHERE code = '2005-999' UNION ALL SELECT 'stock_batches' as source, barcode, warehouse, qty_available as stock, qty_initial as opening FROM stock_batches WHERE barcode = '2005-999' AND status = 'active' UNION ALL SELECT 'store_inventory' as source, barcode, 'STORE' as warehouse, stock, 0 as opening FROM store_inventory WHERE barcode = '2005-999';\"" > product_2005-999_analysis.txt

echo 📊 Analyzing inventory ledger for product 2005-999...

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e \"SELECT event_time, movement_type, direction, qty, location_code, reference, product_name FROM inventory_ledger_base WHERE barcode = '2005-999' ORDER BY event_time DESC LIMIT 50;\"" > product_2005-999_ledger.txt

echo ⚠️ Analyzing stock discrepancies...

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e \"SELECT i.code as barcode, i.warehouse, i.stock as inventory_stock, COALESCE(SUM(sb.qty_available), 0) as batch_stock, (i.stock - COALESCE(SUM(sb.qty_available), 0)) as difference FROM inventory i LEFT JOIN stock_batches sb ON i.code = sb.barcode AND i.warehouse = sb.warehouse AND sb.status = 'active' GROUP BY i.code, i.warehouse, i.stock HAVING difference != 0 ORDER BY ABS(difference) DESC LIMIT 50;\"" > stock_discrepancies.txt

echo 📝 Analyzing store inventory categories...

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e \"SELECT product_name, category, COUNT(*) as count, SUM(stock) as total_stock FROM store_inventory GROUP BY product_name, category ORDER BY count DESC LIMIT 50;\"" > store_inventory_analysis.txt

echo 📊 Creating summary report...

echo INVENTORY DATABASE ANALYSIS SUMMARY > analysis_summary.txt
echo =================================== >> analysis_summary.txt
echo Generated: %date% %time% >> analysis_summary.txt
echo Server: %SERVER_IP% >> analysis_summary.txt
echo Database: %DB_NAME% >> analysis_summary.txt
echo. >> analysis_summary.txt
echo FILES GENERATED: >> analysis_summary.txt
echo - tables_list.txt: All database tables >> analysis_summary.txt
echo - *_structure.txt: Table structures >> analysis_summary.txt
echo - *_count.txt: Record counts >> analysis_summary.txt
echo - *_sample.txt: Sample data >> analysis_summary.txt
echo - product_2005-999_analysis.txt: Specific product analysis >> analysis_summary.txt
echo - product_2005-999_ledger.txt: Product movement history >> analysis_summary.txt
echo - stock_discrepancies.txt: Inventory vs batch stock differences >> analysis_summary.txt
echo - store_inventory_analysis.txt: Store inventory summary >> analysis_summary.txt
echo. >> analysis_summary.txt
echo NEXT STEPS: >> analysis_summary.txt
echo 1. Review product_2005-999_analysis.txt for current stock status >> analysis_summary.txt
echo 2. Check product_2005-999_ledger.txt for movement history >> analysis_summary.txt
echo 3. Analyze stock_discrepancies.txt for data inconsistencies >> analysis_summary.txt
echo 4. Review store_inventory_analysis.txt for "Transferred" category issues >> analysis_summary.txt

echo ✅ Database analysis complete!
echo 📁 All files saved in: %cd%
echo 📋 Check analysis_summary.txt for overview

echo.
echo 🔍 QUICK SUMMARY:
echo ==================

if exist "product_2005-999_analysis.txt" (
    echo 📊 Product 2005-999 Status:
    type product_2005-999_analysis.txt
)

echo.
echo 📁 Files created:
dir *.txt

pause