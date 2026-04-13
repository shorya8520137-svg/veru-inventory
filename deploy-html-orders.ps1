#!/usr/bin/env pwsh

Write-Host "🚀 Deploying HTML Orders Page to Server..." -ForegroundColor Green

# Server details
$SERVER_IP = "18.143.133.96"
$SERVER_USER = "ubuntu"
$HTML_FILE = "website-orders-complete.html"
$REMOTE_PATH = "/var/www/html/orders.html"

Write-Host "📁 Checking if HTML file exists..." -ForegroundColor Yellow
if (-not (Test-Path $HTML_FILE)) {
    Write-Host "❌ Error: $HTML_FILE not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ HTML file found: $HTML_FILE" -ForegroundColor Green

Write-Host "📤 Uploading HTML file to server..." -ForegroundColor Yellow
try {
    # Use SCP to upload the file
    scp $HTML_FILE "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ HTML file uploaded successfully!" -ForegroundColor Green
        Write-Host "🌐 Access the page at: https://${SERVER_IP}:8443/orders.html" -ForegroundColor Cyan
        Write-Host "🌐 Or via IP: https://13.212.51.226:8443/orders.html" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to upload HTML file" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error uploading file: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Open https://13.212.51.226:8443/orders.html in your browser" -ForegroundColor White
Write-Host "   2. Enter your JWT token (get from localStorage.getItem('token'))" -ForegroundColor White
Write-Host "   3. Click 'Search' to load orders with product names" -ForegroundColor White
Write-Host "   4. Use filters to search and export data" -ForegroundColor White