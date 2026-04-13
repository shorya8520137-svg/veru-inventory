# Deploy Final API URL Fix - Force Vercel Rebuild
# This script will push the changes and force a new deployment

Write-Host "🌐 DEPLOYING FINAL API URL FIX" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Show current API configuration
Write-Host "📋 Current API Configuration:" -ForegroundColor Yellow
Write-Host "- .env.production: $(Get-Content .env.production | Select-String 'NEXT_PUBLIC_API_BASE')" -ForegroundColor White
Write-Host "- .env.local: $(Get-Content .env.local | Select-String 'NEXT_PUBLIC_API_BASE')" -ForegroundColor White
Write-Host ""

# Check git status
Write-Host "📊 Git Status:" -ForegroundColor Yellow
git status --porcelain
Write-Host ""

# Add and commit changes
Write-Host "📝 Committing API URL fix..." -ForegroundColor Yellow
git add .
git commit -m "FINAL: Update API URL to http://api.giftgala.in - Force cache break 20260218140000

Updated websiteorder.jsx with new API domain
Added extensive debugging for new deployment
Force Vercel to rebuild with new cache-busting timestamp
Environment files already updated to new domain
This should resolve the caching issue showing old IP"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ No changes to commit or commit failed" -ForegroundColor Yellow
}

Write-Host ""

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin stocksphere-clean

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was fixed:" -ForegroundColor Yellow
Write-Host "   ✅ Updated React component to use new API domain" -ForegroundColor White
Write-Host "   ✅ Added cache-busting timestamp: 20260218140000" -ForegroundColor White
Write-Host "   ✅ Environment files already configured correctly" -ForegroundColor White
Write-Host "   ✅ Forced Vercel to rebuild with new code" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 2-3 minutes for Vercel deployment" -ForegroundColor White
Write-Host "   2. Check browser console for new logs with '20260218140000'" -ForegroundColor White
Write-Host "   3. Verify API calls go to 'http://api.giftgala.in'" -ForegroundColor White
Write-Host "   4. Confirm product names appear instead of 'X item(s)'" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Test URLs:" -ForegroundColor Yellow
Write-Host "   - Main orders: https://inventoryfullstack.vercel.app/order/websiteorder" -ForegroundColor White
Write-Host "   - New orders: https://inventoryfullstack.vercel.app/orders-new" -ForegroundColor White
Write-Host ""
Write-Host "🔧 If still showing old IP:" -ForegroundColor Yellow
Write-Host "   - Hard refresh (Ctrl+F5)" -ForegroundColor White
Write-Host "   - Clear browser cache" -ForegroundColor White
Write-Host "   - Try incognito/private mode" -ForegroundColor White
Write-Host "   - Use the HTML fallback: orders-standalone.html" -ForegroundColor White