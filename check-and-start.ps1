# Check server status and start application

$KEY_PATH = "C:\Users\singh\.ssh\insora.pem"
$SERVER = "ubuntu@13.51.162.72"

Write-Host "Checking server status..." -ForegroundColor Cyan

# Check if npm install is complete
Write-Host "`n1. Checking npm installation..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER "cd /home/ubuntu/inventory-app && test -d node_modules && echo 'node_modules exists' || echo 'node_modules missing'"

# Check if MySQL is running
Write-Host "`n2. Checking MySQL..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER "systemctl is-active mysql || echo 'MySQL not running'"

# Check database
Write-Host "`n3. Checking database..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER "mysql -u inventory_user -pStrongPass@123 -e 'SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema=\"inventory_db\";' 2>/dev/null || echo 'Database not accessible'"

# Run migrations
Write-Host "`n4. Running migrations..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER "cd /home/ubuntu/inventory-app && node run-migrations.js"

# Start server
Write-Host "`n5. Starting server..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER "cd /home/ubuntu/inventory-app && nohup node server.js > logs/server.log 2>&1 & echo \$! > server.pid && echo 'Server started with PID:' && cat server.pid"

Write-Host "`nDone! Server should be running on http://13.51.162.72:3000" -ForegroundColor Green
