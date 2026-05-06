#!/bin/bash
echo "🔍 Searching for git repository..."
echo ""
find ~ /var/www /opt /home -name '.git' -type d 2>/dev/null | head -10
echo ""
echo "✅ Found repositories above"
echo ""
echo "To navigate to your repo, use:"
echo "  cd /path/to/repo"
echo "  git pull origin main"
