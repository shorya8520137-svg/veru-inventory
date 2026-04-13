#!/usr/bin/env pwsh

Write-Host "🧪 Testing HTML Orders Page Locally..." -ForegroundColor Green

$HTML_FILE = "website-orders-complete.html"

Write-Host "📁 Checking if HTML file exists..." -ForegroundColor Yellow
if (-not (Test-Path $HTML_FILE)) {
    Write-Host "❌ Error: $HTML_FILE not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ HTML file found: $HTML_FILE" -ForegroundColor Green

Write-Host "🌐 Opening HTML file in default browser..." -ForegroundColor Yellow
try {
    # Open the HTML file in the default browser
    Start-Process $HTML_FILE
    
    Write-Host "✅ HTML file opened in browser!" -ForegroundColor Green
    Write-Host "📋 Testing instructions:" -ForegroundColor Yellow
    Write-Host "   1. The page should load with a clean interface" -ForegroundColor White
    Write-Host "   2. Enter your JWT token in the token field" -ForegroundColor White
    Write-Host "   3. Click 'Search' to test API connection" -ForegroundColor White
    Write-Host "   4. Verify product names appear (not just '1 item(s)')" -ForegroundColor White
    Write-Host "   5. Test filters and export functionality" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "🔑 To get JWT token:" -ForegroundColor Cyan
    Write-Host "   1. Login to your admin dashboard" -ForegroundColor White
    Write-Host "   2. Open browser console (F12)" -ForegroundColor White
    Write-Host "   3. Type: localStorage.getItem('token')" -ForegroundColor White
    Write-Host "   4. Copy the token value" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error opening HTML file: $_" -ForegroundColor Red
    Write-Host "💡 Try opening manually: $HTML_FILE" -ForegroundColor Yellow
}

Write-Host "Test setup completed!" -ForegroundColor Green