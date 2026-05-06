# Quick Fix Commands for Server Setup

## Problem
npm install created corrupted dependencies causing `Cannot find module 'es-errors/type'` error.

## Solution
Clean reinstall with `--legacy-peer-deps` flag, then complete setup.

---

## Option 1: Automated Script (Recommended)

Run this from your local machine:

```powershell
cd C:\Users\singh\Downloads\veru-inventory-main
.\fix-and-deploy.ps1
```

This will:
1. ✅ Clean and reinstall npm packages
2. ✅ Install and configure MySQL
3. ✅ Upload and import database backup
4. ✅ Run migrations
5. ✅ Start the server

**Time: ~10-15 minutes**

---

## Option 2: Manual Commands (Step by Step)

### Step 1: Connect to Server
```powershell
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.51.162.72
```

### Step 2: Clean and Reinstall npm Packages
```bash
cd /home/ubuntu/inventory-app
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Wait for this to complete (~5-10 minutes)**

### Step 3: Install MySQL (if not installed)
```bash
sudo apt-get update
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Step 4: Configure MySQL Database
```bash
sudo mysql << 'EOF'
CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'inventory_user'@'localhost' IDENTIFIED BY 'StrongPass@123';
GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### Step 5: Upload Database Backup

**Open a NEW PowerShell window** (keep SSH session open):

```powershell
scp -i "C:\Users\singh\.ssh\insora.pem" C:\Users\singh\Downloads\inventory_db_backup.sql ubuntu@13.51.162.72:/home/ubuntu/
```

### Step 6: Import Database (Back in SSH session)
```bash
mysql -u inventory_user -pStrongPass@123 inventory_db < /home/ubuntu/inventory_db_backup.sql
```

**This takes 2-3 minutes. Wait for it to complete.**

### Step 7: Run Migrations
```bash
cd /home/ubuntu/inventory-app
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

### Step 8: Start Server
```bash
cd /home/ubuntu/inventory-app
node server.js
```

You should see:
```
Server running on port 3000
Database connected successfully
```

**Keep this terminal open. Server is now running!**

### Step 9: Test from Another Terminal

Open a NEW SSH session:
```powershell
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.51.162.72
```

Test the API:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

---

## Option 3: Run Server in Background (Better for Production)

After completing steps 1-7 above:

```bash
cd /home/ubuntu/inventory-app

# Kill any existing node process
pkill -f 'node server.js'

# Start in background
nohup node server.js > logs/server.log 2>&1 &

# Check if running
ps aux | grep 'node server.js'

# View logs
tail -f logs/server.log
```

---

## Verification Commands

### Check Server Status
```bash
ps aux | grep node
curl http://localhost:3000/api/health
```

### Check Database
```bash
mysql -u inventory_user -pStrongPass@123 inventory_db -e "SHOW TABLES;"
mysql -u inventory_user -pStrongPass@123 inventory_db -e "SELECT COUNT(*) FROM products;"
mysql -u inventory_user -pStrongPass@123 inventory_db -e "SELECT name FROM permission_templates;"
```

### View Server Logs
```bash
tail -f /home/ubuntu/inventory-app/logs/server.log
```

### Check Port 3000
```bash
sudo netstat -tulpn | grep 3000
```

---

## Troubleshooting

### If npm install fails again
```bash
# Try with different flags
npm install --force
# or
npm install --legacy-peer-deps --force
```

### If MySQL connection fails
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u inventory_user -pStrongPass@123 -e "SELECT 1;"
```

### If server won't start
```bash
# Check for errors
cd /home/ubuntu/inventory-app
node server.js

# Check if port is already in use
sudo netstat -tulpn | grep 3000

# Kill existing process
pkill -f 'node server.js'
```

### If database import fails
```bash
# Check file exists
ls -lh /home/ubuntu/inventory_db_backup.sql

# Try importing with verbose output
mysql -u inventory_user -pStrongPass@123 inventory_db < /home/ubuntu/inventory_db_backup.sql -v
```

---

## AWS Security Group Configuration

**IMPORTANT**: After server is running, configure AWS Security Group:

1. Go to AWS Console → EC2 → Instances
2. Select your instance (13.51.162.72)
3. Click on Security tab
4. Click on the Security Group link
5. Click "Edit inbound rules"
6. Click "Add rule"
7. Configure:
   - Type: Custom TCP
   - Port: 3000
   - Source: 0.0.0.0/0 (or your specific IP for security)
8. Click "Save rules"

---

## Test from Your Machine

After configuring Security Group:

```powershell
curl http://13.51.162.72:3000/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

---

## Next Steps

1. ✅ Server running on 13.51.162.72:3000
2. Update Vercel environment variables:
   - `NEXT_PUBLIC_API_BASE=http://13.51.162.72:3000`
3. Deploy frontend to Vercel
4. Test complete application

---

## Useful Commands Reference

```bash
# Start server
cd /home/ubuntu/inventory-app && node server.js

# Start in background
cd /home/ubuntu/inventory-app && nohup node server.js > logs/server.log 2>&1 &

# Stop server
pkill -f 'node server.js'

# View logs
tail -f /home/ubuntu/inventory-app/logs/server.log

# Check status
ps aux | grep node
curl http://localhost:3000/api/health

# Database access
mysql -u inventory_user -pStrongPass@123 inventory_db

# Restart MySQL
sudo systemctl restart mysql
```

