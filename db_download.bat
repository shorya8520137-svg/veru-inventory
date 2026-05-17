@echo off
echo ============================================
echo  Step 1: Count tables in inventory_db
echo ============================================
ssh -i C:\Users\singh\.ssh\insora.pem -o StrictHostKeyChecking=no ubuntu@13.62.99.152 "sudo mysql -u root -e 'SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = \"inventory_db\" AND table_type = \"BASE TABLE\";'"

echo.
echo ============================================
echo  Step 2: List ALL tables in inventory_db
echo ============================================
ssh -i C:\Users\singh\.ssh\insora.pem -o StrictHostKeyChecking=no ubuntu@13.62.99.152 "sudo mysql -u root inventory_db -e 'SHOW TABLES;'"

echo.
echo ============================================
echo  Step 3: Full dump of inventory_db
echo ============================================
ssh -i C:\Users\singh\.ssh\insora.pem -o StrictHostKeyChecking=no ubuntu@13.62.99.152 "sudo mysqldump -u root --single-transaction --routines --triggers --events inventory_db > /tmp/inventory_db_full.sql && echo DUMP_OK"

echo.
echo ============================================
echo  Step 4: Download to local
echo ============================================
scp -i C:\Users\singh\.ssh\insora.pem -o StrictHostKeyChecking=no ubuntu@13.62.99.152:/tmp/inventory_db_full.sql C:\Users\singh\Downloads\veru-inventory-main\veru-inventory-main\inventory_db_full.sql

echo.
echo ============================================
echo  Step 5: Cleanup from server
echo ============================================
ssh -i C:\Users\singh\.ssh\insora.pem -o StrictHostKeyChecking=no ubuntu@13.62.99.152 "rm -f /tmp/inventory_db_full.sql && echo CLEANUP_OK"

echo.
echo ============================================
echo  DONE! Saved as inventory_db_full.sql
echo ============================================
