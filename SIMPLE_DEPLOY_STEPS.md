# 🚀 SIMPLE DEPLOYMENT STEPS

## Step 1: SSH to Server
```bash
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152
```

## Step 2: Find Your Git Repository
```bash
# Check if you're in the right directory
pwd

# If you see ~/inventory-app, that's NOT the git repo
# Find the actual git repo:
find ~ -name ".git" -type d 2>/dev/null
```

## Step 3: Navigate to Git Repository
```bash
# Example (replace with your actual path):
cd ~/veru-inventory
# OR
cd /var/www/veru-inventory
# OR wherever the .git folder is
```

## Step 4: Configure Git (First Time Only)
```bash
# Set your git credentials
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# If repository is not initialized, clone it:
cd ~
git clone https://github.com/shorya8520137-svg/veru-inventory.git
cd veru-inventory
```

## Step 5: Pull Latest Changes
```bash
# Make sure you're on main branch
git branch

# Pull latest code
git pull origin main
```

## Step 6: Install Dependencies (if package.json changed)
```bash
npm install
```

## Step 7: Build Frontend
```bash
npm run build
```

## Step 8: Restart Backend
```bash
# If using PM2:
pm2 restart all

# If using nohup:
pkill -f "node server.js"
nohup node server.js > server.log 2>&1 &

# If using systemd:
sudo systemctl restart inventory
```

## ✅ Done!

Now test:
1. Go to https://api.giftgala.in/permissions
2. Login as admin@company.com / Admin@123
3. Create/Edit a role
4. See the new tab-based UI with warehouse dropdown!

---

## 🔧 If Git Repository Doesn't Exist:

```bash
# Clone the repository
cd ~
git clone https://github.com/shorya8520137-svg/veru-inventory.git
cd veru-inventory

# Install dependencies
npm install

# Build
npm run build

# Start server
nohup node server.js > server.log 2>&1 &
```
