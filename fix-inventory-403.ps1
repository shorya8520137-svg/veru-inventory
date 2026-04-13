Write-Host "Fixing Inventory 403 Error" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Updated inventoryController.js to properly load user permissions" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Commit the changes:" -ForegroundColor White
Write-Host "   git add controllers/inventoryController.js" -ForegroundColor Gray
Write-Host "   git commit -m 'Fix: Load user permissions in inventory API to resolve 403 error'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Push to server:" -ForegroundColor White
Write-Host "   git push origin stocksphere-clean" -ForegroundColor Gray
Write-Host ""
Write-Host "3. SSH to server and pull changes:" -ForegroundColor White
Write-Host "   ssh ubuntu@54.251.22.246" -ForegroundColor Gray
Write-Host "   cd /path/to/backend" -ForegroundColor Gray
Write-Host "   git pull origin stocksphere-clean" -ForegroundColor Gray
Write-Host "   pm2 restart backend" -ForegroundColor Gray
Write-Host ""
Write-Host "OR run this automated deployment:" -ForegroundColor Yellow
Write-Host ""

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Cyan
git add controllers/inventoryController.js
git commit -m "Fix: Load user permissions in inventory API to resolve 403 error"

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin stocksphere-clean

Write-Host ""
Write-Host "✅ Changes pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "Now SSH to server and run:" -ForegroundColor Yellow
Write-Host "cd /path/to/backend && git pull origin stocksphere-clean && pm2 restart backend" -ForegroundColor White
