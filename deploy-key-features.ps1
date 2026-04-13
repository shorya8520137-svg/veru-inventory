# Deploy Key Features Update

Write-Host "Deploying Key Features Update..." -ForegroundColor Cyan

# Add all changes
Write-Host "`nStaging changes..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "`nCommitting changes..." -ForegroundColor Yellow
git commit -m "Add key features to products: improve performance and add full description modal"

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
git push origin main

# Deploy to Vercel
Write-Host "`nDeploying to Vercel production..." -ForegroundColor Yellow
vercel --prod

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANT: Run the SQL migration on your database:" -ForegroundColor Yellow
Write-Host "   File: add-key-features-field.sql" -ForegroundColor Cyan
