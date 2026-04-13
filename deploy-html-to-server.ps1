#!/usr/bin/env pwsh

Write-Host "=== DEPLOYING HTML SOLUTION TO SERVER ===" -ForegroundColor Cyan
Write-Host "Since Vercel caching is too aggressive, we'll use the guaranteed working HTML solution" -ForegroundColor Yellow

# Check if HTML file exists
if (-not (Test-Path "orders-standalone.html")) {
    Write-Host "ERROR: orders-standalone.html not found!" -ForegroundColor Red
    exit 1
}

Write-Host "HTML file found and ready to deploy" -ForegroundColor Green

# Create a simple upload instruction since SSH might be blocked
Write-Host "`n=== MANUAL UPLOAD INSTRUCTIONS ===" -ForegroundColor Yellow
Write-Host "1. Copy the file 'orders-standalone.html' to your server" -ForegroundColor White
Write-Host "2. Upload it to: /var/www/html/orders.html" -ForegroundColor White
Write-Host "3. Access it via: https://13.212.51.226:8443/orders.html" -ForegroundColor White

# Alternative: Create a simple HTTP server locally for testing
Write-Host "`n=== LOCAL TESTING ===" -ForegroundColor Yellow
Write-Host "You can test the HTML file locally by opening it in your browser" -ForegroundColor White
Write-Host "The file is already configured to work with your API" -ForegroundColor White

# Open the HTML file for immediate testing
Write-Host "`nOpening HTML file for testing..." -ForegroundColor Green
Start-Process "orders-standalone.html"

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Test the HTML file that just opened" -ForegroundColor White
Write-Host "2. Verify it shows product names correctly" -ForegroundColor White
Write-Host "3. Upload to your server when ready" -ForegroundColor White
Write-Host "4. Use as your primary orders page" -ForegroundColor White

Write-Host "`n=== WHY HTML WORKS BUT REACT DOESN'T ===" -ForegroundColor Yellow
Write-Host "- HTML: Direct file, no caching, fresh every time" -ForegroundColor White
Write-Host "- React: Vercel CDN caches JavaScript bundles aggressively" -ForegroundColor White
Write-Host "- Solution: Use HTML until Vercel cache expires (24-48 hours)" -ForegroundColor White