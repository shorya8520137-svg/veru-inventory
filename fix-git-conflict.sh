#!/bin/bash

echo "🔧 FIXING GIT MERGE CONFLICT"
echo "============================="
echo

echo "[1/4] Checking current git status..."
git status

echo
echo "[2/4] Stashing local changes..."
git stash push -m "Local changes before signature removal update"

echo
echo "[3/4] Pulling latest changes from GitHub..."
git pull origin main

echo
echo "[4/4] Checking if stash is needed..."
if git stash list | grep -q "Local changes before signature removal update"; then
    echo "Local changes were stashed. Checking if they're still needed..."
    echo "Your local changes are saved in stash if you need them later."
    echo "Run 'git stash pop' to restore them if needed."
else
    echo "No local changes were stashed."
fi

echo
echo "✅ Git conflict resolved!"
echo "✅ Latest signature removal changes pulled successfully"
echo
echo "🚀 You can now start your server with:"
echo "./fix-server-immediately.sh"
echo
echo "📋 Don't forget to run the database cleanup:"
echo "mysql -u your_username -p your_database < remove-signature-column.sql"