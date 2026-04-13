# Test Website Orders API
# This script tests the backend API to verify product names are being returned

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Website Orders API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# API endpoint
$apiUrl = "https://13.212.51.226:8443/api/website/orders?page=1&limit=5"

Write-Host "API URL: $apiUrl" -ForegroundColor Yellow
Write-Host ""

# Get token (you'll need to replace this with your actual token)
Write-Host "Enter your JWT token (or press Enter to test without auth):" -ForegroundColor Yellow
$token = Read-Host

$headers = @{
    "Content-Type" = "application/json"
}

if ($token -and $token.Trim() -ne "") {
    $headers["Authorization"] = "Bearer $token"
}

Write-Host ""
Write-Host "Making API request..." -ForegroundColor Green

try {
    # Ignore SSL certificate errors for self-signed certs
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

    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "API RESPONSE SUCCESS" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Show response structure
    Write-Host "Response Structure:" -ForegroundColor Cyan
    Write-Host "  - success: $($response.success)" -ForegroundColor White
    Write-Host "  - data.orders: $($response.data.orders.Count) orders" -ForegroundColor White
    Write-Host ""
    
    # Show first order details
    if ($response.data.orders.Count -gt 0) {
        $firstOrder = $response.data.orders[0]
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "FIRST ORDER DETAILS" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Order Number: $($firstOrder.order_number)" -ForegroundColor Yellow
        Write-Host "Customer: $($firstOrder.customer_name)" -ForegroundColor White
        Write-Host "Email: $($firstOrder.customer_email)" -ForegroundColor White
        Write-Host "Phone: $($firstOrder.customer_phone)" -ForegroundColor White
        Write-Host "Total Amount: $($firstOrder.currency)$($firstOrder.total_amount)" -ForegroundColor White
        Write-Host "Status: $($firstOrder.status)" -ForegroundColor White
        Write-Host "Item Count: $($firstOrder.item_count)" -ForegroundColor White
        Write-Host ""
        
        Write-Host "Products Array:" -ForegroundColor Cyan
        if ($firstOrder.products -and $firstOrder.products.Count -gt 0) {
            Write-Host "  ✓ Products array exists with $($firstOrder.products.Count) item(s)" -ForegroundColor Green
            Write-Host ""
            
            foreach ($product in $firstOrder.products) {
                Write-Host "  Product:" -ForegroundColor Yellow
                Write-Host "    - Product ID: $($product.product_id)" -ForegroundColor White
                Write-Host "    - Product Name: $($product.product_name)" -ForegroundColor Green
                Write-Host "    - Quantity: $($product.quantity)" -ForegroundColor White
                Write-Host "    - Unit Price: $($product.unit_price)" -ForegroundColor White
                Write-Host "    - Total Price: $($product.total_price)" -ForegroundColor White
                Write-Host ""
            }
        } else {
            Write-Host "  ✗ Products array is empty or missing!" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "ALL ORDERS SUMMARY" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        foreach ($order in $response.data.orders) {
            $productNames = if ($order.products -and $order.products.Count -gt 0) {
                ($order.products | ForEach-Object { $_.product_name }) -join ", "
            } else {
                "NO PRODUCTS"
            }
            
            Write-Host "$($order.order_number): $productNames" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "FULL JSON RESPONSE (First Order)" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host ($firstOrder | ConvertTo-Json -Depth 10) -ForegroundColor Gray
        
    } else {
        Write-Host "No orders found in response" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "API REQUEST FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan
