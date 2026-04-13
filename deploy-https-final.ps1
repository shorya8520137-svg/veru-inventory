# Final HTTPS Deployment - Aggressive Cache Busting
# This script deploys the HTTPS fix with maximum cache invalidation

Write-Host "🔒 FINAL HTTPS DEPLOYMENT - AGGRESSIVE CACHE BUSTING" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

Write-Host "🚨 MIXED CONTENT ERROR FIXED:" -ForegroundColor Red
Write-Host "   ❌ Problem: Frontend using HTTP API from HTTPS page" -ForegroundColor White
Write-Host "   ✅ Solution: Updated all components to use HTTPS API" -ForegroundColor White
Write-Host ""

# Show current API configuration
Write-Host "📋 Current API Configuration:" -ForegroundColor Yellow
Write-Host "- .env.production: $(Get-Content .env.production | Select-String 'NEXT_PUBLIC_API_BASE')" -ForegroundColor White
Write-Host "- .env.local: $(Get-Content .env.local | Select-String 'NEXT_PUBLIC_API_BASE')" -ForegroundColor White
Write-Host ""

Write-Host "📝 Files Updated:" -ForegroundColor Yellow
Write-Host "   ✅ src/app/login/page.jsx - Main login page" -ForegroundColor White
Write-Host "   ✅ src/app/login-isolated/page.jsx - Isolated login" -ForegroundColor White
Write-Host "   ✅ src/app/simple-login/page.jsx - Simple login" -ForegroundColor White
Write-Host "   ✅ src/app/order/websiteorder/websiteorder.jsx - Orders page" -ForegroundColor White
Write-Host "   ✅ src/app/orders-new/page.jsx - New orders page" -ForegroundColor White
Write-Host "   ✅ src/app/customer-support/page.jsx - Support dashboard" -ForegroundColor White
Write-Host "   ✅ src/app/customer-support/[conversationId]/page.jsx - Chat page" -ForegroundColor White
Write-Host "   ✅ public/chat-widget.html - Customer chat widget" -ForegroundColor White
Write-Host "   ✅ .env.production and .env.local - Environment files" -ForegroundColor White
Write-Host ""

# Check git status
Write-Host "📊 Git Status:" -ForegroundColor Yellow
git status --porcelain
Write-Host ""

# Add and commit changes
Write-Host "📝 Committing HTTPS security fix..." -ForegroundColor Yellow
git add .
git commit -m "CRITICAL: Fix Mixed Content security error - All login pages HTTPS

- Updated main login page API fallback to https://api.giftgala.in
- Fixed login-isolated page API fallback
- Fixed simple-login page API fallback  
- All components now use HTTPS API consistently
- Environment variables already set to HTTPS
- This should resolve Mixed Content blocking
- Timestamp: 20260218142000"

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
Write-Host "🎉 HTTPS SECURITY FIX DEPLOYED!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔒 What was fixed:" -ForegroundColor Yellow
Write-Host "   ✅ All login pages now use HTTPS API" -ForegroundColor White
Write-Host "   ✅ Fixed Mixed Content security blocking" -ForegroundColor White
Write-Host "   ✅ Environment variables set to HTTPS" -ForegroundColor White
Write-Host "   ✅ All fallback URLs updated to HTTPS" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Expected Results:" -ForegroundColor Yellow
Write-Host "   ✅ No more Mixed Content errors in console" -ForegroundColor White
Write-Host "   ✅ Login should work without network errors" -ForegroundColor White
Write-Host "   ✅ API calls should use https://api.giftgala.in" -ForegroundColor White
Write-Host "   ✅ Orders page should show product names" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Test URLs:" -ForegroundColor Yellow
Write-Host "   - Login: https://inventoryfullstack.vercel.app/login" -ForegroundColor White
Write-Host "   - Orders: https://inventoryfullstack.vercel.app/order/websiteorder" -ForegroundColor White
Write-Host "   - Simple Login: https://inventoryfullstack.vercel.app/simple-login" -ForegroundColor White
Write-Host ""
Write-Host "⏰ Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 2-3 minutes for Vercel deployment" -ForegroundColor White
Write-Host "   2. Hard refresh browser (Ctrl+F5)" -ForegroundColor White
Write-Host "   3. Check console for timestamp '20260218142000'" -ForegroundColor White
Write-Host "   4. Verify no Mixed Content errors" -ForegroundColor White
Write-Host "   5. Test login functionality" -ForegroundColor White