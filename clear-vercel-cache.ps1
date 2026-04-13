# Clear Vercel Cache and Force Redeploy
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clearing Vercel Cache" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Building fresh..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "Step 2: Deploying to Vercel with cache bypass..." -ForegroundColor Yellow
vercel --prod --force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NOW DO THIS IN YOUR BROWSER:" -ForegroundColor Yellow
Write-Host "1. Open DevTools (F12)" -ForegroundColor White
Write-Host "2. Go to Network tab" -ForegroundColor White
Write-Host "3. Check 'Disable cache' checkbox" -ForegroundColor White
Write-Host "4. Right-click refresh button and select 'Empty Cache and Hard Reload'" -ForegroundColor White
Write-Host "5. Or press: Ctrl + Shift + Delete to clear all browser data" -ForegroundColor White
Write-Host ""
Write-Host "Alternative: Open in Incognito/Private window" -ForegroundColor Cyan
Write-Host ""
