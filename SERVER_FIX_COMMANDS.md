# Server Fix Commands

## Problem
Syntax error in node_modules - corrupted package installation

## Solution
Run these commands on your server (47.129.8.24):

```bash
# 1. Navigate to project
cd ~/inventoryfullstack

# 2. Switch to correct branch
git fetch origin stocksphere-phase-1-complete
git checkout stocksphere-phase-1-complete
git pull origin stocksphere-phase-1-complete

# 3. Remove corrupted files
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next

# 4. Clean npm cache
npm cache clean --force

# 5. Reinstall dependencies (this will take 5-10 minutes)
npm install --legacy-peer-deps

# 6. Build the application
npm run build

# 7. Restart PM2
pm2 restart all

# 8. Check status
pm2 list
pm2 logs --lines 50
```

## Quick Fix (One Command)

Or copy the fix script and run it:

```bash
# On your local machine, copy the script to server
scp -i "C:\Users\Public\e2c.pem.pem" fix-server-error.sh ubuntu@47.129.8.24:~/

# Then on the server
ssh -i "C:\Users\Public\e2c.pem.pem" ubuntu@47.129.8.24
chmod +x ~/fix-server-error.sh
./fix-server-error.sh
```

## Verification

After running the commands, test:

```bash
# Check if server is running
curl -k https://47.129.8.24:8443/

# Check PM2 status
pm2 status

# View logs
pm2 logs inventory-app --lines 20
```

## Common Issues

### If npm install fails:
```bash
# Try with different flags
npm install --force
# or
npm install --legacy-peer-deps --force
```

### If build fails:
```bash
# Check Node version (should be 20+)
node --version

# If Node version is old, update it:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### If PM2 doesn't restart:
```bash
# Stop all processes
pm2 stop all

# Delete all processes
pm2 delete all

# Start fresh
pm2 start npm --name "inventory-app" -- start

# Save PM2 configuration
pm2 save
```

## Expected Output

After successful fix, you should see:
- PM2 showing "online" status
- Server responding at https://47.129.8.24:8443
- No syntax errors in logs
