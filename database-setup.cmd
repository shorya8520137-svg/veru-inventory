@echo off
echo ========================================
echo Database Setup Script
echo ========================================
echo Server: 54.179.63.233
echo Database: inventory_db
echo ========================================

echo.
echo Step 1: Testing SSH Connection...
ssh -i "C:\Users\Admin\e2c.pem" ubuntu@54.179.63.233 "echo 'SSH connection successful'"

if %ERRORLEVEL% neq 0 (
    echo ERROR: SSH connection failed
    pause
    exit /b 1
)

echo.
echo Step 2: Uploading database backup...
scp -i "C:\Users\Admin\e2c.pem" "C:\Users\Admin\Downloads\inventory_db_compressed (1).sql\inventory_db_compressed (1).sql" ubuntu@54.179.63.233:~/backup.sql

if %ERRORLEVEL% neq 0 (
    echo ERROR: File upload failed
    pause
    exit /b 1
)

echo.
echo Step 3: Setting up MySQL and database...
ssh -i "C:\Users\Admin\e2c.pem" ubuntu@54.179.63.233 "
echo 'Installing MySQL...'
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

echo 'Creating database and user...'
sudo mysql -e \"CREATE DATABASE IF NOT EXISTS inventory_db;\"
sudo mysql -e \"CREATE USER IF NOT EXISTS 'inventory_user'@'localhost' IDENTIFIED BY 'StrongPass@123';\"
sudo mysql -e \"GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost';\"
sudo mysql -e \"FLUSH PRIVILEGES;\"

echo 'Restoring database from backup...'
mysql -u inventory_user -pStrongPass@123 inventory_db < ~/backup.sql

echo 'Testing database connection...'
mysql -u inventory_user -pStrongPass@123 inventory_db -e \"SHOW TABLES;\"

echo 'Cleaning up backup file...'
rm ~/backup.sql

echo 'Database setup completed successfully!'
"

echo.
echo ========================================
echo Database Setup Complete!
echo ========================================
echo Database: inventory_db
echo User: inventory_user
echo Password: StrongPass@123
echo Host: 127.0.0.1:3306
echo ========================================

pause