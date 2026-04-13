Write-Host "Updating Vercel Environment Variable" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Remove old environment variable
Write-Host "Step 1: Removing old NEXT_PUBLIC_API_BASE..." -ForegroundColor Yellow
vercel env rm NEXT_PUBLIC_API_BASE production

Write-Host ""
Write-Host "Step 2: Adding new NEXT_PUBLIC_API_BASE..." -ForegroundColor Yellow
Write-Host "When prompted, enter: https://54.251.22.246:8443" -ForegroundColor Green
Write-Host ""

# This will prompt for the value
vercel env add NEXT_PUBLIC_API_BASE production

Write-Host ""
Write-Host "Step 3: Deploying with new environment..." -ForegroundColor Yellow
vercel --prod

Write-Host ""
Write-Host "✅ Done! Vercel should now use the new IP address" -ForegroundColor Green
