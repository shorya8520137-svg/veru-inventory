# Complete Server Setup and Deployment Script
# This script will fix npm issues, setup MySQL, import database, and start the server

$ErrorActionPreference = "Stop"
$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SERVER = "ubuntu@13.51.162.72"
$DB_BACKUP = "C:\Users\singh\Downloads\inventory_db_backup.sql"

Write-Host "Starting Complete Server Setup..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean and reinstall npm packages
Write-Host "Step 1: Cleaning and reinstalling npm packages..." -ForegroundColor Yellow
$cmd1 = "cd /home/ubuntu/inventory-app && echo 'Removing corrupted node_modules...' && rm -rf node_modules package-lock.json && echo 'Installing packages with --legacy-peer-deps...' && npm install --legacy-peer-deps && echo 'npm install completed'"
ssh -i $SSH_KEY $SERVER $cmd1

if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed!" -ForegroundColor Red
    exit 1
}

Write-Host "npm packages installed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Check if MySQL is installed, install if not
Write-Host "Step 2: Setting up MySQL..." -ForegroundColor Yellow
$cmd2 = "if ! command -v mysql &> /dev/null; then echo 'MySQL not found, installing...' && sudo apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server && sudo systemctl start mysql && sudo systemctl enable mysql && echo 'MySQL installed'; else echo 'MySQL already installed' && sudo systemctl start mysql; fi"
ssh -i $SSH_KEY $SERVER $cmd2

Write-Host "MySQL is ready" -ForegroundColor Green
Write-Host ""

# Step 3: Configure MySQL database and user
Write-Host "Step 3: Configuring MySQL database..." -ForegroundColor Yellow
$cmd3 = "sudo mysql -e `"CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; CREATE USER IF NOT EXISTS 'inventory_user'@'localhost' IDENTIFIED BY 'StrongPass@123'; GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost'; FLUSH PRIVILEGES;`" && echo 'Database and user configured'"
ssh -i $SSH_KEY $SERVER $cmd3

Write-Host "Database configured" -ForegroundColor Green
Write-Host ""

# Step 4: Upload database backup
Write-Host "Step 4: Uploading database backup (77MB)..." -ForegroundColor Yellow
if (Test-Path $DB_BACKUP) {
    scp -i $SSH_KEY $DB_BACKUP "${SERVER}:/home/ubuntu/inventory_db_backup.sql"
    Write-Host "Database backup uploaded" -ForegroundColor Green
} else {
    Write-Host "Database backup not found at: $DB_BACKUP" -ForegroundColor Yellow
    Write-Host "   Skipping database import. You'll need to upload it manually." -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Import database
Write-Host "Step 5: Importing database (this takes 2-3 minutes)..." -ForegroundColor Yellow
$cmd5 = "if [ -f /home/ubuntu/inventory_db_backup.sql ]; then echo 'Importing database...' && mysql -u inventory_user -pStrongPass@123 inventory_db < /home/ubuntu/inventory_db_backup.sql && echo 'Database imported successfully' && rm /home/ubuntu/inventory_db_backup.sql; else echo 'Database backup file not found, skipping import'; fi"
ssh -i $SSH_KEY $SERVER $cmd5

Write-Host "Database imported" -ForegroundColor Green
Write-Host ""

# Step 6: Run migrations
Write-Host "Step 6: Running database migrations..." -ForegroundColor Yellow
$cmd6 = "cd /home/ubuntu/inventory-app && node run-migrations.js"
ssh -i $SSH_KEY $SERVER $cmd6

Write-Host "Migrations completed" -ForegroundColor Green
Write-Host ""

# Step 7: Start server with node
Write-Host "Step 7: Starting server..." -ForegroundColor Yellow
$cmd7 = "cd /home/ubuntu/inventory-app && pkill -f 'node server.js' || true && nohup node server.js > /home/ubuntu/inventory-app/logs/server.log 2>&1 & sleep 3 && if curl -s http://localhost:3000/api/health > /dev/null; then echo 'Server started successfully' && echo 'Server is running on port 3000'; else echo 'Server may not be responding yet, check logs'; fi"
ssh -i $SSH_KEY $SERVER $cmd7

Write-Host "Server started" -ForegroundColor Green
Write-Host ""

# Step 8: Verify everything
Write-Host "Step 8: Verifying deployment..." -ForegroundColor Yellow
$cmd8 = "echo 'Server Status:' && ps aux | grep 'node server.js' | grep -v grep || echo 'Server not running' && echo '' && echo 'Files:' && ls -lh /home/ubuntu/inventory-app/ | grep -E '(server.js|package.json|.env.local)' && echo '' && echo 'Database Tables:' && mysql -u inventory_user -pStrongPass@123 inventory_db -e 'SHOW TABLES;' | head -20 && echo '' && echo 'Recent Server Logs:' && tail -20 /home/ubuntu/inventory-app/logs/server.log"
ssh -i $SSH_KEY $SERVER $cmd8

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Server Details:" -ForegroundColor Cyan
Write-Host "   URL: http://13.51.162.72:3000" -ForegroundColor White
Write-Host "   Health Check: http://13.51.162.72:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs: ssh -i '$SSH_KEY' $SERVER 'tail -f /home/ubuntu/inventory-app/logs/server.log'" -ForegroundColor White
Write-Host "   Restart: ssh -i '$SSH_KEY' $SERVER 'pkill -f node && cd /home/ubuntu/inventory-app && nohup node server.js > logs/server.log 2>&1 &'" -ForegroundColor White
Write-Host "   Stop: ssh -i '$SSH_KEY' $SERVER 'pkill -f node'" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Configure AWS Security Group to allow port 3000!" -ForegroundColor Yellow
Write-Host "   Go to AWS Console -> EC2 -> Security Groups" -ForegroundColor White
Write-Host "   Add inbound rule: TCP port 3000 from 0.0.0.0/0" -ForegroundColor White
Write-Host ""
