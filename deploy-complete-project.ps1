# Complete Project Deployment to Insora Server
# Deploys backend, database, and runs migrations

$SERVER_IP = "13.51.162.72"
$KEY_PATH = "C:\Users\singh\.ssh\insora.pem"
$SERVER_USER = "ubuntu"
$REMOTE_DIR = "/home/ubuntu/inventory-app"
$DB_BACKUP = "inventory_db_backup.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Complete Project Deployment" -ForegroundColor Cyan
Write-Host "  Server: $SERVER_IP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test SSH Connection
Write-Host "[1/10] Testing SSH connection..." -ForegroundColor Yellow
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo 'SSH OK'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: SSH connection failed!" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: SSH connected!" -ForegroundColor Green
Write-Host ""

# Step 2: Update System
Write-Host "[2/10] Updating system packages..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} "sudo apt-get update -qq"
Write-Host "SUCCESS: System updated!" -ForegroundColor Green
Write-Host ""

# Step 3: Install MySQL
Write-Host "[3/10] Installing MySQL..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
sudo apt-get install -y mysql-server > /dev/null 2>&1
sudo systemctl start mysql
sudo systemctl enable mysql
"@
Write-Host "SUCCESS: MySQL installed!" -ForegroundColor Green
Write-Host ""

# Step 4: Install Node.js
Write-Host "[4/10] Installing Node.js..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - > /dev/null 2>&1
sudo apt-get install -y nodejs > /dev/null 2>&1
"@
Write-Host "SUCCESS: Node.js installed!" -ForegroundColor Green
Write-Host ""

# Step 5: Configure MySQL
Write-Host "[5/10] Configuring MySQL database..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
sudo mysql -e \"CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;\"
sudo mysql -e \"CREATE USER IF NOT EXISTS 'inventory_user'@'localhost' IDENTIFIED BY 'StrongPass@123';\"
sudo mysql -e \"GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost';\"
sudo mysql -e \"FLUSH PRIVILEGES;\"
"@
Write-Host "SUCCESS: MySQL configured!" -ForegroundColor Green
Write-Host ""

# Step 6: Create Directory Structure
Write-Host "[6/10] Creating directory structure..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
mkdir -p $REMOTE_DIR
mkdir -p $REMOTE_DIR/uploads
mkdir -p $REMOTE_DIR/logs
"@
Write-Host "SUCCESS: Directories created!" -ForegroundColor Green
Write-Host ""

# Step 7: Upload Project Files
Write-Host "[7/10] Uploading project files (this may take a few minutes)..." -ForegroundColor Yellow

# Create exclusion list
$excludeFile = "rsync-exclude.txt"
@"
node_modules/
.next/
.git/
*.log
.env.local
.DS_Store
"@ | Out-File -FilePath $excludeFile -Encoding ASCII

# Upload using SCP (since rsync might not be available on Windows)
Write-Host "  - Uploading backend files..." -ForegroundColor Gray
scp -i $KEY_PATH -r routes ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH -r controllers ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH -r middleware ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH -r db ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH -r migrations ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH server.js ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH package.json ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH run-migrations.js ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH .env.insora ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/.env.local

Remove-Item $excludeFile
Write-Host "SUCCESS: Project files uploaded!" -ForegroundColor Green
Write-Host ""

# Step 8: Upload and Import Database
Write-Host "[8/10] Uploading database backup (77MB, ~2-3 minutes)..." -ForegroundColor Yellow
scp -i $KEY_PATH $DB_BACKUP ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/

Write-Host "  - Importing database..." -ForegroundColor Gray
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
mysql -u inventory_user -pStrongPass@123 inventory_db < ${REMOTE_DIR}/${DB_BACKUP}
"@
Write-Host "SUCCESS: Database imported!" -ForegroundColor Green
Write-Host ""

# Step 9: Install Dependencies and Run Migrations
Write-Host "[9/10] Installing dependencies and running migrations..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
cd $REMOTE_DIR
npm install --production
node run-migrations.js
"@
Write-Host "SUCCESS: Dependencies installed and migrations completed!" -ForegroundColor Green
Write-Host ""

# Step 10: Start Server with PM2
Write-Host "[10/10] Starting backend server..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
sudo npm install -g pm2
cd $REMOTE_DIR
pm2 delete inventory-backend 2>/dev/null || true
pm2 start server.js --name inventory-backend
pm2 save
pm2 startup
"@
Write-Host "SUCCESS: Server started!" -ForegroundColor Green
Write-Host ""

# Verification
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verifying deployment..." -ForegroundColor Yellow
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
echo ""
echo "=== System Info ==="
node --version
mysql --version
echo ""
echo "=== Database Tables ==="
mysql -u inventory_user -pStrongPass@123 inventory_db -e 'SHOW TABLES;' | head -20
echo ""
echo "=== Server Status ==="
pm2 status
echo ""
echo "=== Server Logs (last 10 lines) ==="
pm2 logs inventory-backend --lines 10 --nostream
"@

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server IP:      $SERVER_IP" -ForegroundColor White
Write-Host "Backend URL:    http://${SERVER_IP}:3000" -ForegroundColor White
Write-Host "Database:       inventory_db (imported)" -ForegroundColor White
Write-Host "Tables:         79 tables + 4 new permission tables" -ForegroundColor White
Write-Host "Server Status:  Running with PM2" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  Connect:      ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Gray
Write-Host "  View logs:    pm2 logs inventory-backend" -ForegroundColor Gray
Write-Host "  Restart:      pm2 restart inventory-backend" -ForegroundColor Gray
Write-Host "  Stop:         pm2 stop inventory-backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test API: curl http://${SERVER_IP}:3000/api/health" -ForegroundColor Gray
Write-Host "  2. Update Vercel env: NEXT_PUBLIC_API_BASE=http://${SERVER_IP}:3000" -ForegroundColor Gray
Write-Host "  3. Deploy frontend to Vercel" -ForegroundColor Gray
Write-Host ""
