# Check backend logs for order creation errors
$SSH_KEY = "C:\Users\Public\e2c.pem.pem"
$SERVER = "ubuntu@13.212.51.226"

Write-Host "Recent backend logs:" -ForegroundColor Cyan
ssh -i $SSH_KEY $SERVER "pm2 logs --lines 50 --nostream"
