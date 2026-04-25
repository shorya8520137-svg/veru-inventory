# Fix timeline authentication and loading issues

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "Fixing timeline authentication and loading issues..." -ForegroundColor Cyan
Write-Host ""

# Upload fixed files
Write-Host "Uploading fixed timeline routes..." -ForegroundColor Yellow
scp -i $sshKey "routes/timelineRoutes.js" "${sshHost}:/home/ubuntu/inventoryfullstack/routes/"

Write-Host "Uploading fixed StoreTimeline component..." -ForegroundColor Yellow
scp -i $sshKey "src/app/inventory/StoreTimeline.jsx" "${sshHost}:/home/ubuntu/inventoryfullstack/src/app/inventory/"

# Restart the backend
Write-Host "Restarting backend server..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost "cd /home/ubuntu/inventoryfullstack && pm2 restart backend"

Write-Host ""
Write-Host "Timeline fixes deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "  - Fixed timeline API authentication (JWT instead of API key)" -ForegroundColor White
Write-Host "  - Updated StoreTimeline to use correct API endpoints" -ForegroundColor White
Write-Host "  - Added better error handling to prevent auto-logout" -ForegroundColor White
Write-Host "  - Improved empty state UI" -ForegroundColor White
Write-Host ""
Write-Host "Test the timeline now - it should load without authentication errors!" -ForegroundColor Green