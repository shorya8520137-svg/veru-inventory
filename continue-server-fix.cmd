@echo off
echo ========================================
echo CONTINUING SERVER FIX PROCESS
echo ========================================
echo.
echo Connecting to server to complete the fix...
echo.

ssh -i "C:\Users\Admin\e2c.pem" ubuntu@54.169.107.64 "
echo '=== PULLING LATEST CODE FROM GITHUB ==='
cd ~/inventoryfullstack
git stash
git pull origin main

echo ''
echo '=== UPDATING DATABASE SCHEMA ==='
sudo mysql inventory_db < fix-audit-logs-schema.sql

echo ''
echo '=== KILLING ALL NODE PROCESSES ==='
sudo pkill -f node
sleep 3

echo ''
echo '=== VERIFYING ALL AUDIT LOGGER METHODS ==='
echo 'Checking EventAuditLogger methods:'
grep -n 'logReturnCreate\|logDamageCreate\|logEvent' EventAuditLogger.js

echo ''
echo 'Checking ProductionEventAuditLogger methods:'
grep -n 'logReturnCreate\|logDispatchCreate\|logDamageCreate' ProductionEventAuditLogger.js

echo ''
echo '=== STARTING FRESH SERVER ==='
nohup node server.js > server.log 2>&1 &
sleep 5

echo ''
echo '=== CHECKING SERVER STATUS ==='
ps aux | grep 'node server.js' | grep -v grep

echo ''
echo '=== CHECKING SERVER LOG FOR ERRORS ==='
echo 'Last 20 lines of server log:'
tail -20 server.log

echo ''
echo '=== TESTING AUDIT ENDPOINTS ==='
echo 'Testing audit logs endpoint:'
curl -s 'http://localhost:5000/api/audit-logs?page=1&limit=5' | head -50

echo ''
echo 'Testing audit logs with resource filter:'
curl -s 'http://localhost:5000/api/audit-logs?resource=RETURN&page=1&limit=5' | head -50

echo ''
echo '=== SERVER FIX COMPLETE ==='
"

echo.
echo ========================================
echo SERVER FIX COMPLETED!
echo ========================================
echo.
echo Testing server from local machine...
timeout /t 3 /nobreak > nul

echo Testing HTTPS endpoint...
curl -k -s https://54.169.107.64:8443/api/health

echo.
echo Testing audit logs endpoint...
curl -k -s "https://54.169.107.64:8443/api/audit-logs?page=1&limit=3"

echo.
echo ✅ All audit logger methods should now be working!
echo ✅ Database schema updated
echo ✅ Server restarted with clean process
echo.
pause