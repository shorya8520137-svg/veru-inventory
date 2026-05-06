# Step-by-Step Manual Deployment Guide

The automated script had some issues. Let's do it step by step manually.

## Step 1: Connect to Server
```powershell
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.51.162.72
```

## Step 2: Install MySQL (On Server)
```bash
sudo apt-get update
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

## Step 3: Install Node.js (On Server)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v18.x
```

## Step 4: Configure MySQL (On Server)
```bash
sudo mysql << EOF
CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'inventory_user'@'localhost' IDENTIFIED BY 'StrongPass@123';
GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

## Step 5: Create Directory (On Server)
```bash
mkdir -p /home/ubuntu/inventory-app
cd /home/ubuntu/inventory-app
```

## Step 6: Upload Files (From Your Machine)

Open a NEW PowerShell window (keep SSH session open):

```powershell
cd C:\Users\singh\Downloads\veru-inventory-main

# Upload database backup
scp -i "C:\Users\singh\.ssh\insora.pem" ..\inventory_db_backup.sql ubuntu@13.51.162.72:/home/ubuntu/

# Upload project files
scp -i "C:\Users\singh\.ssh\insora.pem" -r veru-inventory-main/routes ubuntu@13.51.162.72:/home/ubuntu/inventory-app/
scp -i "C:\Users\singh\.ssh\insora.pem" -r veru-inventory-main/controllers ubuntu@13.51.162.72:/home/ubuntu/inventory-app/
scp -i "C:\Users\singh\.ssh\insora.pem" -r veru-inventory-main/middleware ubuntu@13.51.162.72:/home/ubuntu/inventory-app/
scp -i "C:\Users\singh\.ssh\insora.pem" -r veru-inventory-main/db ubuntu@13.51.162.72:/home/ubuntu/inventory-app/
scp -i "C:\Users\singh\.ssh\insora.pem" -r veru-inventory-main/migrations ubuntu@13.51.162.72:/home/ubuntu/inventory-app/
scp -i "C:\Users\singh\.ssh\insora.pem" veru-inventory-main/server.js ubuntu@13.51.162.72:/home/ubuntu/inventory-app/
scp -i "C:\Users\singh\.ssh\insora.pem" veru-inventory-main/package.json ubuntu@13.51.162.72:/home/ubuntu/inventory-app/
scp -i "C:\Users\singh\.ssh\insora.pem" veru-inventory-main/run-migrations.js ubuntu@13.51.162.72:/home/ubuntu/inventory-app/
scp -i "C:\Users\singh\.ssh\insora.pem" veru-inventory-main/.env.insora ubuntu@13.51.162.72:/home/ubuntu/inventory-app/.env.local
```

## Step 7: Import Database (On Server)
```bash
cd /home/ubuntu
mysql -u inventory_user -pStrongPass@123 inventory_db < inventory_db_backup.sql
```

This will take 2-3 minutes. Wait for it to complete.

## Step 8: Install Dependencies (On Server)
```bash
cd /home/ubuntu/inventory-app
npm install
```

## Step 9: Run Migrations (On Server)
```bash
node run-migrations.js
```

You should see:
```
🔌 Connecting to database...
✅ Connected to database

📄 Running migration: 001_create_permission_templates.sql
✅ Completed: 001_create_permission_templates.sql
...
🎉 All migrations completed successfully!
```

## Step 10: Start Server (On Server)
```bash
# Install PM2
sudo npm install -g pm2

# Start server
pm2 start server.js --name inventory-backend

# Save PM2 config
pm2 save

# Set PM2 to start on boot
pm2 startup
# Copy and run the command it shows
```

## Step 11: Verify Everything Works

### Check Server Status
```bash
pm2 status
pm2 logs inventory-backend --lines 20
```

### Check Database
```bash
mysql -u inventory_user -pStrongPass@123 inventory_db -e "SHOW TABLES;"
mysql -u inventory_user -pStrongPass@123 inventory_db -e "SELECT name FROM permission_templates;"
```

### Test API
```bash
curl http://localhost:3000/api/health
```

## Step 12: Configure Firewall (On Server)
```bash
# Allow port 3000
sudo ufw allow 3000/tcp
sudo ufw status
```

## Step 13: Test from Your Machine
```powershell
curl http://13.51.162.72:3000/api/health
```

## Troubleshooting

### MySQL not starting
```bash
sudo systemctl status mysql
sudo journalctl -u mysql -n 50
```

### Node.js not found
```bash
which node
which npm
# If not found, reinstall Node.js
```

### Permission denied
```bash
sudo chown -R ubuntu:ubuntu /home/ubuntu/inventory-app
```

### Port 3000 not accessible
```bash
# Check if server is listening
sudo netstat -tulpn | grep 3000

# Check AWS Security Group
# Go to AWS Console → EC2 → Security Groups
# Add inbound rule: TCP port 3000 from 0.0.0.0/0
```

## Next Steps After Successful Deployment

1. Update Vercel environment variables:
   - `NEXT_PUBLIC_API_BASE=http://13.51.162.72:3000`

2. Deploy frontend to Vercel:
   ```bash
   git push origin main
   ```

3. Test complete workflow

4. Set up domain (optional):
   - Point domain to 13.51.162.72
   - Set up Nginx reverse proxy
   - Add SSL certificate
