#!/bin/bash

echo "=========================================="
echo "  PULL AND DEPLOY PERMISSIONS SYSTEM"
echo "=========================================="
echo ""

# Find the git repository
echo "🔍 Finding git repository..."

# Search for .git directories
echo "Searching for git repositories..."
FOUND_REPOS=$(find ~ /var/www /opt /home -name '.git' -type d 2>/dev/null | head -10)

if [ -z "$FOUND_REPOS" ]; then
    echo "❌ ERROR: No git repositories found!"
    echo ""
    echo "Please navigate to your project directory manually and run:"
    echo "  cd /path/to/your/project"
    echo "  git pull origin main"
    echo "  pm2 restart all"
    exit 1
fi

echo ""
echo "📂 Found git repositories:"
echo "$FOUND_REPOS"
echo ""

# Try to find the veru-inventory repository
REPO_DIR=""
while IFS= read -r git_dir; do
    project_dir=$(dirname "$git_dir")
    
    # Check if this looks like our project (has server.js or package.json with our project name)
    if [ -f "$project_dir/server.js" ] || [ -f "$project_dir/package.json" ]; then
        # Check if package.json contains "veru" or "inventory"
        if [ -f "$project_dir/package.json" ]; then
            if grep -qi "veru\|inventory" "$project_dir/package.json" 2>/dev/null; then
                REPO_DIR="$project_dir"
                echo "✅ Found veru-inventory project at: $REPO_DIR"
                break
            fi
        fi
        
        # If server.js exists and no other match found yet, use this
        if [ -z "$REPO_DIR" ] && [ -f "$project_dir/server.js" ]; then
            REPO_DIR="$project_dir"
        fi
    fi
done <<< "$FOUND_REPOS"

if [ -z "$REPO_DIR" ]; then
    echo "❌ ERROR: Could not identify the veru-inventory project!"
    echo ""
    echo "Please specify the project directory manually:"
    echo "  cd /path/to/veru-inventory"
    echo "  git pull origin main"
    echo "  pm2 restart all"
    exit 1
fi

echo ""
echo "📂 Using repository: $REPO_DIR"
echo ""

# Navigate to repository
cd "$REPO_DIR" || exit 1

# Show current branch and status
echo "📊 Current status:"
git branch 2>/dev/null || echo "Not in a git repository"
git status --short 2>/dev/null || echo "Cannot get git status"
echo ""

# Stash any local changes
echo "💾 Stashing local changes (if any)..."
git stash 2>/dev/null

# Pull latest changes
echo "⬇️  Pulling latest changes from GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Git pull failed!"
    echo ""
    echo "Trying to reset and pull again..."
    git fetch origin
    git reset --hard origin/main
    
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Still failed. Please check git configuration."
        exit 1
    fi
fi

echo ""
echo "✅ Pull successful!"
echo ""

# Check if package.json changed
if git diff HEAD@{1} --name-only 2>/dev/null | grep -q "package.json"; then
    echo "📦 package.json changed, running npm install..."
    npm install
    echo ""
fi

# Restart backend
echo "🔄 Restarting backend..."

# Check which process manager is being used
if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    pm2 restart all
    echo ""
    echo "📊 PM2 Status:"
    pm2 list
elif command -v systemctl &> /dev/null && systemctl is-active --quiet inventory; then
    echo "Using systemd..."
    sudo systemctl restart inventory
    sudo systemctl status inventory --no-pager
else
    echo "⚠️  No process manager found."
    echo ""
    echo "Looking for running Node.js processes..."
    ps aux | grep node | grep -v grep
    echo ""
    echo "If you see a node process above, kill it and restart:"
    echo "  pkill -f 'node server.js'"
    echo "  cd $REPO_DIR"
    echo "  nohup node server.js > server.log 2>&1 &"
fi

echo ""
echo "=========================================="
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🎉 Your permissions system is now updated!"
echo ""
echo "📁 Updated files:"
echo "  - src/app/permissions/RoleModalNew.jsx (NEW)"
echo "  - src/app/permissions/page.jsx"
echo "  - src/app/permissions/permissions.module.css"
echo "  - src/utils/api.js"
echo ""
echo "🧪 Test it:"
echo "1. Go to your frontend URL"
echo "2. Login as admin@company.com / Admin@123"
echo "3. Navigate to Permissions page"
echo "4. Click 'Create Role' or 'Edit Role'"
echo "5. See the new tab-based UI with warehouse dropdown!"
echo ""
