# Deploy Product Detail Modal to Server
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"

Write-Host "=== Deploying Product Detail Modal ===" -ForegroundColor Green

# Step 1: Copy ProductDetailModal component
Write-Host "`nUploading ProductDetailModal component..." -ForegroundColor Yellow
scp -i "$sshKey" "src/components/ProductDetailModal.jsx" "${serverUser}@${serverIP}:~/inventoryfullstack/src/components/"
scp -i "$sshKey" "src/components/ProductDetailModal.module.css" "${serverUser}@${serverIP}:~/inventoryfullstack/src/components/"

# Step 2: Update website products page
Write-Host "Updating website products page..." -ForegroundColor Yellow
scp -i "$sshKey" "src/app/website-products/page.jsx" "${serverUser}@${serverIP}:~/inventoryfullstack/src/app/website-products/"

# Step 3: Restart the application
Write-Host "`nRestarting application..." -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "cd ~/inventoryfullstack && pm2 restart all || (npm run build && pm2 start npm --name 'inventory-app' -- start)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Product Detail Modal deployed successfully!" -ForegroundColor Green
    Write-Host "`nFeatures:" -ForegroundColor Cyan
    Write-Host "  - Click on product image to view details" -ForegroundColor White
    Write-Host "  - Multi-image gallery with thumbnails" -ForegroundColor White
    Write-Host "  - Full product information display" -ForegroundColor White
    Write-Host "  - Responsive design for all devices" -ForegroundColor White
    Write-Host "  - Smooth animations and transitions" -ForegroundColor White
} else {
    Write-Host "`n❌ Deployment failed" -ForegroundColor Red
}

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green