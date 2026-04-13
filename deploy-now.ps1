# Simple deployment - pull and restart
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@18.143.133.96"

Write-Host "Deploying..." -ForegroundColor Cyan

ssh -i $SSH_KEY $SERVER @"
cd ~/inventoryfullstack && \
git fetch origin && \
git reset --hard origin/stocksphere-clean && \
pm2 restart all && \
pm2 logs --lines 20 --nostream
"@

Write-Host ""
Write-Host "Done! Refresh your browser." -ForegroundColor Green
