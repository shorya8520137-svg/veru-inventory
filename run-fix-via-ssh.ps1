# Run fix script on server via SSH
$SERVER = "ubuntu@13.212.82.15"
$SSH_KEY = "C:\Users\singh\.ssh\pem.pem"

Write-Host "🚀 Running Timeline API fix on server..." -ForegroundColor Green

$COMMANDS = @"
cd ~/inventoryfullstack && \
echo '📥 Pulling latest code...' && \
git pull origin main && \
echo '🔄 Restarting PM2...' && \
pm2 stop backend && \
pm2 delete backend && \
pm2 start server.js --name backend && \
pm2 save && \
echo '✅ Done! Testing API...' && \
curl -H 'X-API-Key: wk_live_2848739b35b3a50207e5b9e56795ec52e8d5aecfbf74bc41e95dd593af4f1059' https://api.giftgala.in/api/timeline
"@

ssh -i $SSH_KEY $SERVER $COMMANDS

Write-Host "`n✅ Script execution complete!" -ForegroundColor Green
