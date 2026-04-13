@echo off
echo Starting Complete Inventory Flow Analysis...
echo ==========================================

REM Copy SQL file to server and execute
scp -i "C:\Users\Admin\e2c.pem" complete-inventory-analysis.sql ubuntu@18.143.163.44:/tmp/

REM Execute the complete analysis
ssh -i "C:\Users\Admin\e2c.pem" ubuntu@18.143.163.44 "sudo mysql -u root inventory_db < /tmp/complete-inventory-analysis.sql"

echo.
echo Complete analysis finished!
echo.
echo SUMMARY: Based on the database structure, here are the manual in/out movement opportunities:
echo.
echo 1. INVENTORY ADJUSTMENTS - Direct stock in/out adjustments
echo 2. STOCK TRANSACTIONS - Complete movement tracking
echo 3. SELF TRANSFER - Internal location transfers  
echo 4. WAREHOUSE DISPATCH - Outbound movements
echo 5. RETURNS - Return processing
echo 6. DAMAGE RECOVERY - Damage tracking and recovery
echo.
pause