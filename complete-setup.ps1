# Complete Server Setup - Final Steps
$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SERVER = "ubuntu@13.51.162.72"
$DB_BACKUP = "C:\Users\singh\Downloads\veru-inventory-main\inventory_db_backup.sql"

Write-Host "Completing server setup..." -ForegroundColor Cyan

# Step 1: Configure database
Write-Host "Step 1: Configuring database..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "sudo mariadb -e 'CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;' && sudo mariadb -e 'CREATE USER IF NOT EXISTS inventory_user@localhost IDENTIFIED BY ''StrongPass@123'';' && sudo mariadb -e 'GRANT ALL PRIVILEGES ON inventory_db.* TO inventory_user@localhost;' && sudo mariadb -e 'FLUSH PRIVILEGES;' && echo 'Database configured'"

Write-Host "Database configured" -ForegroundColor Green

# Step 2: Upload database backup
Write-Host "Step 2: Uploading database backup (77MB)..." -ForegroundColor Yellow
scp -i $SSH_KEY $DB_BACKUP "${SERVER}:/home/ubuntu/inventory_db_backup.sql"
Write-Host "Database backup uploaded" -ForegroundColor Green

# Step 3: Import database
Write-Host "Step 3: Importing database (takes 2-3 minutes)..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "mariadb -u inventory_user -pStrongPass@123 inventory_db < /home/ubuntu/inventory_db_backup.sql && echo 'Database imported' && rm /home/ubuntu/inventory_db_backup.sql"
Write-Host "Database imported successfully" -ForegroundColor Green

# Step 4: Run migrations
Write-Host "Step 4: Running migrations..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "cd /home/ubuntu/inventory-app && node run-migrations.js"
Write-Host "Migrations completed" -ForegroundColor Green

# Step 5: Start server
Write-Host "Step 5: Starting server..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "cd /home/ubuntu/inventory-app && pkill -f 'node server.js' || true && nohup node server.js > logs/server.log 2>&1 & sleep 3 && echo 'Server started'"
Write-Host "Server started" -ForegroundColor Green

# Step 6: Verify
Write-Host "Step 6: Verifying..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "ps aux | grep 'node server.js' | grep -v grep && echo '' && echo 'Testing API:' && curl -s http://localhost:3000/api/health"

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Server URL: http://13.51.162.72:3000" -ForegroundColor Cyan
Write-Host "Health Check: http://13.51.162.72:3000/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Configure AWS Security Group!" -ForegroundColor Yellow
Write-Host "  1. Go to AWS Console -> EC2 -> Security Groups" -ForegroundColor White
Write-Host "  2. Add inbound rule: TCP port 3000 from 0.0.0.0/0" -ForegroundColor White
Write-Host ""
Write-Host "View logs: ssh -i '$SSH_KEY' $SERVER 'tail -f /home/ubuntu/inventory-app/logs/server.log'" -ForegroundColor White
Write-Host ""
