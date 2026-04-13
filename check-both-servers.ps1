Write-Host "Checking BOTH servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Skip SSL validation
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

# Test OLD server (13.212.51.226)
Write-Host "`n1. Testing OLD server: 13.212.51.226:8443" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://13.212.51.226:8443/api/website/orders?page=1&limit=1" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ OLD server is responding!" -ForegroundColor Green
    Write-Host "   Orders found: $($response.data.orders.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ OLD server not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Test NEW server (54.251.22.246)
Write-Host "`n2. Testing NEW server: 54.251.22.246:8443" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://54.251.22.246:8443/api/website/orders?page=1&limit=1" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ NEW server is responding!" -ForegroundColor Green
    Write-Host "   Orders found: $($response.data.orders.Count)" -ForegroundColor Green
    
    if ($response.data.orders.Count -gt 0) {
        $order = $response.data.orders[0]
        Write-Host "`n   Sample order:" -ForegroundColor Cyan
        Write-Host "   - Order: $($order.order_number)" -ForegroundColor White
        Write-Host "   - Customer: $($order.customer_name)" -ForegroundColor White
        Write-Host "   - Products: $($order.products.Count) items" -ForegroundColor White
        if ($order.products.Count -gt 0) {
            Write-Host "   - Product names: $($order.products.product_name -join ', ')" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ❌ NEW server not responding: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DNS Status:" -ForegroundColor Yellow
Write-Host "api.giftgala.in → 13.212.51.226 (OLD server)" -ForegroundColor White
Write-Host ""
Write-Host "Solution:" -ForegroundColor Green
Write-Host "1. Update DNS A record for api.giftgala.in to point to 54.251.22.246" -ForegroundColor White
Write-Host "2. OR use IP directly: https://54.251.22.246:8443" -ForegroundColor White
