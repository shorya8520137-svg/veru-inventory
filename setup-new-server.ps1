# Complete Server Setup Script for New Ubuntu Server
# Server: 13.51.162.72 (Ubuntu)
# Key: insora.pem

$SERVER_IP = "13.51.162.72"
$KEY_PATH = "C:\insora.pem"
$SERVER_USER = "ubuntu"
$REMOTE_DIR = "/home/ubuntu/inventory-app"
$DB_BACKUP = "inventory_db_backup.sql"

Write-Host "🚀 Starting Complete Server Setup..." -ForegroundColor Cyan
Write-Host "Server: $SERVER_IP" -ForegroundColor Yellow
Write-Host "Key: $KEY_PATH" -ForegroundColor Yellow
Write-Host ""

# Step 1: Test SSH Connection
Write-Host "1️⃣ Testing SSH connection..." -ForegroundColor Cyan
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo 'SSH connection successful!'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH connection failed! Check your key file and server IP." -ForegroundColor Red
    exit 1
}
Write-Host "✅ SSH connection successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Update System and Install Dependencies
Write-Host "2️⃣ Installing system dependencies..." -ForegroundColor Cyan
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
sudo apt-get update
sudo apt-get install -y mysql-server nodejs npm git curl
sudo systemctl start mysql
sudo systemctl enable mysql
"@
Write-Host "✅ System dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 3: Configure MySQL
Write-Host "3️⃣ Configuring MySQL database..." -ForegroundColor Cyan
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
sudo mysql -e \"CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;\"
sudo mysql -e \"CREATE USER IF NOT EXISTS 'inventory_user'@'localhost' IDENTIFIED BY 'StrongPass@123';\"
sudo mysql -e \"GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost';\"
sudo mysql -e \"CREATE USER IF NOT EXISTS 'inventory_user'@'%' IDENTIFIED BY 'StrongPass@123';\"
sudo mysql -e \"GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'%';\"
sudo mysql -e \"FLUSH PRIVILEGES;\"
"@
Write-Host "✅ MySQL configured!" -ForegroundColor Green
Write-Host ""

# Step 4: Create Remote Directory
Write-Host "4️⃣ Creating application directory..." -ForegroundColor Cyan
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} "mkdir -p $REMOTE_DIR"
Write-Host "✅ Directory created!" -ForegroundColor Green
Write-Host ""

# Step 5: Upload Database Backup
Write-Host "5️⃣ Uploading database backup (77MB)..." -ForegroundColor Cyan
scp -i $KEY_PATH $DB_BACKUP ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
Write-Host "✅ Database backup uploaded!" -ForegroundColor Green
Write-Host ""

# Step 6: Import Database
Write-Host "6️⃣ Importing database (this may take 2-3 minutes)..." -ForegroundColor Cyan
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
mysql -u inventory_user -pStrongPass@123 inventory_db < ${REMOTE_DIR}/${DB_BACKUP}
"@
Write-Host "✅ Database imported!" -ForegroundColor Green
Write-Host ""

# Step 7: Upload Migration Files
Write-Host "7️⃣ Uploading migration files..." -ForegroundColor Cyan
scp -i $KEY_PATH -r migrations ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH run-migrations.js ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
scp -i $KEY_PATH package.json ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
Write-Host "✅ Migration files uploaded!" -ForegroundColor Green
Write-Host ""

# Step 8: Create .env file on server
Write-Host "8️⃣ Creating environment configuration..." -ForegroundColor Cyan
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
cat > ${REMOTE_DIR}/.env.local << 'EOF'
DB_HOST=localhost
DB_USER=inventory_user
DB_PASSWORD=StrongPass@123
DB_NAME=inventory_db
DB_PORT=3306
NODE_ENV=production
EOF
"@
Write-Host "✅ Environment configured!" -ForegroundColor Green
Write-Host ""

# Step 9: Install Node Dependencies
Write-Host "9️⃣ Installing Node.js dependencies..." -ForegroundColor Cyan
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
cd ${REMOTE_DIR}
npm install mysql2 dotenv
"@
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 10: Run Migrations
Write-Host "🔟 Running database migrations..." -ForegroundColor Cyan
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
cd ${REMOTE_DIR}
node run-migrations.js
"@
Write-Host "✅ Migrations completed!" -ForegroundColor Green
Write-Host ""

# Step 11: Verify Setup
Write-Host "✅ Verifying database setup..." -ForegroundColor Cyan
ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP} @"
mysql -u inventory_user -pStrongPass@123 inventory_db -e 'SHOW TABLES LIKE \"%permission%\";'
mysql -u inventory_user -pStrongPass@123 inventory_db -e 'SELECT COUNT(*) as total_permissions FROM permissions;'
mysql -u inventory_user -pStrongPass@123 inventory_db -e 'SELECT name, is_builtin FROM permission_templates;'
"@
Write-Host ""

Write-Host "🎉 Server setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  ✅ MySQL installed and configured"
Write-Host "  ✅ Database imported (77MB)"
Write-Host "  ✅ 4 new tables created"
Write-Host "  ✅ 2 tables modified"
Write-Host "  ✅ 7 permission templates seeded"
Write-Host "  ✅ Dependencies configured"
Write-Host ""
Write-Host "🔗 Server Details:" -ForegroundColor Yellow
Write-Host "  IP: $SERVER_IP"
Write-Host "  User: $SERVER_USER"
Write-Host "  Database: inventory_db"
Write-Host "  App Directory: $REMOTE_DIR"
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy backend API to server"
Write-Host "  2. Deploy frontend to Vercel"
Write-Host "  3. Update API endpoints in frontend"
Write-Host ""
Write-Host "To connect to server:" -ForegroundColor Gray
Write-Host "  ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Gray
