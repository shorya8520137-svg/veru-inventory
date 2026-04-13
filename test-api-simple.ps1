# Simple API Test Script
Write-Host "Testing Website Orders API..." -ForegroundColor Cyan
Write-Host ""

# Get token
Write-Host "Paste your JWT token (from browser localStorage):" -ForegroundColor Yellow
Write-Host "(In browser console, run: localStorage.getItem('token'))" -ForegroundColor Gray
$token = Read-Host

Write-Host ""
Write-Host "Calling API..." -ForegroundColor Green

# Build URL with proper escaping
$url = "https://13.212.51.226:8443/api/website/orders?page=1&limit=3"

Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

# Use Invoke-WebRequest instead of curl
try {
    # Ignore SSL certificate errors
    if (-not ([System.Management.Automation.PSTypeName]'TrustAllCertsPolicy').Type) {
        Add-Type @"
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
    }
    [System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $response = Invoke-WebRequest -Uri $url -Method Get -Headers $headers -UseBasicParsing
    $result = $response.Content

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "API RESPONSE:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor White
    Write-Host ""

    # Try to parse and show product names
    $json = $result | ConvertFrom-Json
    
    if ($json.success -and $json.data.orders) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "PRODUCT NAMES FOUND:" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        
        foreach ($order in $json.data.orders) {
            Write-Host ""
            Write-Host "Order: $($order.order_number)" -ForegroundColor Yellow
            
            if ($order.products -and $order.products.Count -gt 0) {
                foreach ($product in $order.products) {
                    Write-Host "  - $($product.product_name) (Qty: $($product.quantity), Price: $($product.unit_price))" -ForegroundColor Green
                }
            } else {
                Write-Host "  NO PRODUCTS ARRAY!" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "API returned success=false or no orders" -ForegroundColor Yellow
    }

} catch {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
