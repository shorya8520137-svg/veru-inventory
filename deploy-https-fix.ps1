# Deploy HTTPS Security Fix - Mixed Content Resolution
# This script fixes the Mixed Content error by using HTTPS

Write-Host "🔒 DEPLOYING HTTPS SECURITY FIX" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

Write-Host "🚨 ISSUE IDENTIFIED:" -ForegroundColor Red
Write-Host "   Mixed Content Error: HTTPS page trying to load HTTP resource" -ForegroundColor White
Write-Host "   Browser blocked: http://api.giftgala.in (insecure)" -ForegroundColor White
Write-Host "   Solution: Change to https://api.giftgala.in (secure)" -ForegroundColor White
Write-Host ""

# Show current API configuration
Write-Host "📋 Updated API Configuration:" -ForegroundColor Yellow
Write-Host "- .env.production: $(Get-Content .env.production | Select-String 'NEXT_PUBLIC_API_BASE')" -ForegroundColor White
Write-Host "- .env.local: $(Get-Content .env.local | Select-String 'NEXT_PUBLIC_API_BASE')" -ForegroundColor White
Write-Host ""

# Check git status
Write-Host "📊 Git Status:" -ForegroundColor Yellow
git status --porcelain
Write-Host ""

# Add and commit changes
Write-Host "📝 Committing HTTPS security fix..." -ForegroundColor Yellow
git add .
git commit -m "SECURITY: Fix Mixed Content error - Update API to HTTPS

- Changed API URL from http://api.giftgala.in to https://api.giftgala.in
- Fixed Mixed Content security error blocking API calls
- Updated all environment files and components
- Added HTTPS protocol validation in debugging
- Timestamp: 20260218141500"

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
Write-Host "   ✅ Changed API URL to HTTPS (secure)" -ForegroundColor White
Write-Host "   ✅ Fixed Mixed Content security error" -ForegroundColor White
Write-Host "   ✅ Updated all environment files" -ForegroundColor White
Write-Host "   ✅ Updated all React components" -ForegroundColor White
Write-Host "   ✅ Updated chat widget and test files" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 2-3 minutes for Vercel deployment" -ForegroundColor White
Write-Host "   2. Check browser console for '20260218141500' timestamp" -ForegroundColor White
Write-Host "   3. Verify API calls go to 'https://api.giftgala.in' (HTTPS)" -ForegroundColor White
Write-Host "   4. Confirm no Mixed Content errors in console" -ForegroundColor White
Write-Host "   5. Verify product names appear correctly" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Test URLs:" -ForegroundColor Yellow
Write-Host "   - Main orders: https://inventoryfullstack.vercel.app/order/websiteorder" -ForegroundColor White
Write-Host "   - New orders: https://inventoryfullstack.vercel.app/orders-new" -ForegroundColor White
Write-Host "   - Login page: https://inventoryfullstack.vercel.app/login" -ForegroundColor White
Write-Host ""
Write-Host "✅ Expected Result:" -ForegroundColor Green
Write-Host "   - No more Mixed Content errors" -ForegroundColor White
Write-Host "   - API calls work successfully" -ForegroundColor White
Write-Host "   - Product names display correctly" -ForegroundColor White
Write-Host "   - Login works without network errors" -ForegroundColor White