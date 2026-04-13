# Deploy Auto-Play Reels Section to Server
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"

Write-Host "=== Deploying Auto-Play Reels Section ===" -ForegroundColor Green

# Step 1: Copy ReelSection component
Write-Host "`nUploading ReelSection component..." -ForegroundColor Yellow
scp -i "$sshKey" "src/components/ReelSection.jsx" "${serverUser}@${serverIP}:~/inventoryfullstack/src/components/"
scp -i "$sshKey" "src/components/ReelSection.module.css" "${serverUser}@${serverIP}:~/inventoryfullstack/src/components/"

# Step 2: Copy reels page
Write-Host "Uploading reels page..." -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "mkdir -p ~/inventoryfullstack/src/app/reels"
scp -i "$sshKey" "src/app/reels/page.jsx" "${serverUser}@${serverIP}:~/inventoryfullstack/src/app/reels/"

# Step 3: Update sidebar
Write-Host "Updating sidebar..." -ForegroundColor Yellow
scp -i "$sshKey" "src/components/ui/sidebar.jsx" "${serverUser}@${serverIP}:~/inventoryfullstack/src/components/ui/"

# Step 4: Restart the application
Write-Host "`nRestarting application..." -ForegroundColor Yellow
ssh -i "$sshKey" "${serverUser}@${serverIP}" "cd ~/inventoryfullstack && pm2 restart all || (npm run build && pm2 start npm --name 'inventory-app' -- start)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Auto-Play Reels section deployed successfully!" -ForegroundColor Green
    Write-Host "Features:" -ForegroundColor Cyan
    Write-Host "  - Videos auto-play in loop" -ForegroundColor White
    Write-Host "  - Auto-advance to next reel" -ForegroundColor White
    Write-Host "  - Images show for 5 seconds" -ForegroundColor White
    Write-Host "  - Manual navigation available" -ForegroundColor White
    Write-Host "`nAccess it at: https://your-domain.com/reels" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Deployment failed" -ForegroundColor Red
}

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green