# Correct Server Startup Commands

## ❌ WRONG (what you did)
```bash
# You were in the controllers directory
ubuntu@ip-172-31-38-159:~/inventoryfullstack/controllers$ node server.js
# ERROR: server.js is not in the controllers folder!
```

## ✅ CORRECT Commands

### Option 1: Manual Steps
```bash
# 1. Navigate to the main project directory
cd /home/ubuntu/inventoryfullstack

# 2. Pull latest changes
git pull origin main

# 3. Run emergency fix
node emergency-fix-api-key.js

# 4. Start server
node server.js
```

### Option 2: Use the Fix Script
```bash
# Navigate to project directory
cd /home/ubuntu/inventoryfullstack

# Make script executable and run it
chmod +x fix-and-start-server.sh
./fix-and-start-server.sh
```

## 📁 Directory Structure
```
/home/ubuntu/inventoryfullstack/          ← Main project directory (server.js is HERE)
├── server.js                            ← Server file
├── emergency-fix-api-key.js             ← Emergency fix script
├── controllers/                         ← Controllers folder
│   ├── apiKeysController.js            ← Where you were trying to run server.js
│   └── websiteOrderController.js
└── routes/
    └── ...
```

## 🎯 Key Points
- **server.js** is in the **main project directory** (`/home/ubuntu/inventoryfullstack/`)
- **NOT** in the controllers subdirectory
- Always run `node server.js` from the main project directory

## 🚀 After Running These Commands
Your server should start successfully and your frontend will be able to create orders without any crashes!