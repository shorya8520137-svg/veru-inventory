# Test New API Domain - http://api.giftgala.in
# This script tests the new API domain to ensure it's working

Write-Host "🌐 TESTING NEW API DOMAIN" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

$NEW_API_URL = "https://api.giftgala.in/api/website/orders?page=1&limit=3"
$OLD_API_URL = "https://13.212.51.226:8443/api/website/orders?page=1&limit=3"

Write-Host "🔗 New API URL: $NEW_API_URL" -ForegroundColor Yellow
Write-Host "🔗 Old API URL: $OLD_API_URL" -ForegroundColor Gray
Write-Host ""

# Get token from user
$token = Read-Host "Enter your JWT token (from localStorage.getItem('token'))"

if (-not $token) {
    Write-Host "❌ No token provided. Cannot test authenticated endpoints." -ForegroundColor Red
    exit 1
}

$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

Write-Host "🧪 Testing NEW API domain..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $NEW_API_URL -Method Get -Headers $headers -TimeoutSec 10
    
    Write-Host "✅ NEW API WORKING!" -ForegroundColor Green
    Write-Host "📊 Response Status: Success" -ForegroundColor White
    Write-Host "📋 Orders Count: $($response.data.orders.Count)" -ForegroundColor White
    
    if ($response.data.orders.Count -gt 0) {
        $firstOrder = $response.data.orders[0]
        Write-Host "📦 First Order: $($firstOrder.order_number)" -ForegroundColor White
        Write-Host "👤 Customer: $($firstOrder.customer_name)" -ForegroundColor White
        Write-Host "🛍️ Products: $($firstOrder.products.Count)" -ForegroundColor White
        
        if ($firstOrder.products.Count -gt 0) {
            Write-Host "🏷️ Product Names:" -ForegroundColor White
            foreach ($product in $firstOrder.products) {
                Write-Host "   - $($product.product_name)" -ForegroundColor Cyan
            }
        }
    }
    
} catch {
    Write-Host "❌ NEW API FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🧪 Testing OLD API domain (should fail)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $OLD_API_URL -Method Get -Headers $headers -TimeoutSec 5
    Write-Host "⚠️ OLD API STILL WORKING (unexpected)" -ForegroundColor Yellow
} catch {
    Write-Host "✅ OLD API CORRECTLY FAILED (expected)" -ForegroundColor Green
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎯 SUMMARY:" -ForegroundColor Green
Write-Host "============" -ForegroundColor Green
Write-Host "✅ New domain should work: https://api.giftgala.in" -ForegroundColor White
Write-Host "❌ Old IP should fail: 13.212.51.226:8443" -ForegroundColor White
Write-Host ""
Write-Host "🔍 If frontend still shows old IP:" -ForegroundColor Yellow
Write-Host "   - Vercel is serving cached JavaScript" -ForegroundColor White
Write-Host "   - Wait for new deployment to propagate" -ForegroundColor White
Write-Host "   - Check console logs for timestamp '20260218140000'" -ForegroundColor White
Write-Host "   - Use hard refresh (Ctrl+F5)" -ForegroundColor White