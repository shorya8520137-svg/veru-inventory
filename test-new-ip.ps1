Write-Host "Testing New API IP: 54.251.22.246:8443" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    # Test API endpoint
    $url = "https://54.251.22.246:8443/api/website/orders?page=1&limit=5"
    
    Write-Host "`nCalling API: $url" -ForegroundColor Yellow
    
    # Skip SSL certificate validation for self-signed certs
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
    
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    
    Write-Host "`n✅ API is responding!" -ForegroundColor Green
    Write-Host "Total Orders: $($response.data.orders.Count)" -ForegroundColor Green
    
    if ($response.data.orders.Count -gt 0) {
        $firstOrder = $response.data.orders[0]
        Write-Host "`nFirst Order:" -ForegroundColor Yellow
        Write-Host "  Order Number: $($firstOrder.order_number)"
        Write-Host "  Customer: $($firstOrder.customer_name)"
        Write-Host "  Amount: $($firstOrder.currency)$($firstOrder.total_amount)"
        Write-Host "  Products: $($firstOrder.products.Count) items"
        
        if ($firstOrder.products.Count -gt 0) {
            Write-Host "`n  Product Names:" -ForegroundColor Green
            foreach ($product in $firstOrder.products) {
                Write-Host "    - $($product.product_name)" -ForegroundColor Green
            }
        }
    }
    
    Write-Host "`n✅ API is working correctly with new IP!" -ForegroundColor Green
    Write-Host "`nOpening HTML file..." -ForegroundColor Cyan
    Start-Process "website-orders-complete.html"
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPlease check:" -ForegroundColor Yellow
    Write-Host "1. Server is running on 54.251.22.246:8443"
    Write-Host "2. Nginx is configured correctly"
    Write-Host "3. SSL certificate is valid"
}
