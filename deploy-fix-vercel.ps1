#!/usr/bin/env pwsh

Write-Host "Deploying React fix to Vercel..." -ForegroundColor Green

# Add timestamp to force cache invalidation
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Host "Deployment timestamp: $timestamp" -ForegroundColor Yellow

# Add a comment with timestamp to force git change
$comment = "// Cache bust: $timestamp"
Add-Content -Path "src/app/order/websiteorder/websiteorder.jsx" -Value $comment

Write-Host "1. Committing changes to git..." -ForegroundColor Yellow
git add .
git commit -m "Fix product names display - remove hard-coded logic $timestamp"

Write-Host "2. Pushing to GitHub..." -ForegroundColor Yellow
git push origin stocksphere-clean

Write-Host "3. Deploying to Vercel..." -ForegroundColor Yellow
try {
    # Force production deployment
    vercel --prod --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vercel deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Vercel deployment failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error during Vercel deployment: $_" -ForegroundColor Red
}

Write-Host "4. Clearing browser cache..." -ForegroundColor Yellow
Write-Host "   - Open your admin dashboard" -ForegroundColor White
Write-Host "   - Press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "   - Or open in incognito mode" -ForegroundColor White

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "Check the browser console for debug logs" -ForegroundColor Cyan