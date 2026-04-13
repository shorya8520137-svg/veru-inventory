# Debug API Response - Show exact data structure
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEBUG: Website Orders API Response" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get token
Write-Host "Paste your JWT token:" -ForegroundColor Yellow
$token = Read-Host

Write-Host ""
Write-Host "Fetching orders..." -ForegroundColor Green

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

    $url = "https://13.212.51.226:8443/api/website/orders?page=1&limit=5"
    $response = Invoke-WebRequest -Uri $url -Method Get -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "API RESPONSE ANALYSIS" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Response Structure:" -ForegroundColor Cyan
    Write-Host "  - success: $($data.success)" -ForegroundColor White
    Write-Host "  - data exists: $($data.data -ne $null)" -ForegroundColor White
    Write-Host "  - data.orders exists: $($data.data.orders -ne $null)" -ForegroundColor White
    Write-Host "  - orders count: $($data.data.orders.Count)" -ForegroundColor White
    Write-Host ""

    if ($data.data.orders -and $data.data.orders.Count -gt 0) {
        $ordersWithProducts = 0
        $ordersWithoutProducts = 0
        $totalProducts = 0

        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "ORDERS ANALYSIS" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host ""

        foreach ($order in $data.data.orders) {
            Write-Host "Order: $($order.order_number)" -ForegroundColor Cyan
            Write-Host "  - Customer: $($order.customer_name)" -ForegroundColor White
            Write-Host "  - Amount: $($order.currency)$($order.total_amount)" -ForegroundColor White
            Write-Host "  - Item Count: $($order.item_count)" -ForegroundColor White
            Write-Host "  - Products Array Exists: $($order.products -ne $null)" -ForegroundColor White
            Write-Host "  - Products Array Type: $($order.products.GetType().Name)" -ForegroundColor White
            Write-Host "  - Products Array Length: $($order.products.Count)" -ForegroundColor White
            
            if ($order.products -and $order.products.Count -gt 0) {
                $ordersWithProducts++
                $totalProducts += $order.products.Count
                Write-Host "  - Products:" -ForegroundColor Green
                foreach ($product in $order.products) {
                    Write-Host "    * $($product.product_name) (ID: $($product.product_id), Qty: $($product.quantity))" -ForegroundColor Green
                }
            } else {
                $ordersWithoutProducts++
                Write-Host "  - NO PRODUCTS FOUND!" -ForegroundColor Red
                Write-Host "  - Products value: $($order.products)" -ForegroundColor Red
            }
            Write-Host ""
        }

        Write-Host "========================================" -ForegroundColor Magenta
        Write-Host "SUMMARY" -ForegroundColor Magenta
        Write-Host "========================================" -ForegroundColor Magenta
        Write-Host "Total Orders: $($data.data.orders.Count)" -ForegroundColor White
        Write-Host "Orders WITH Products: $ordersWithProducts" -ForegroundColor Green
        Write-Host "Orders WITHOUT Products: $ordersWithoutProducts" -ForegroundColor Red
        Write-Host "Total Products: $totalProducts" -ForegroundColor White
        Write-Host ""

        if ($ordersWithoutProducts -gt 0) {
            Write-Host "PROBLEM DETECTED!" -ForegroundColor Red
            Write-Host "Some orders are missing the products array!" -ForegroundColor Red
        } else {
            Write-Host "SUCCESS!" -ForegroundColor Green
            Write-Host "All orders have products array with product names!" -ForegroundColor Green
        }

        Write-Host ""
        Write-Host "========================================" -ForegroundColor Gray
        Write-Host "FIRST ORDER RAW JSON" -ForegroundColor Gray
        Write-Host "========================================" -ForegroundColor Gray
        Write-Host ($data.data.orders[0] | ConvertTo-Json -Depth 10) -ForegroundColor Gray

    } else {
        Write-Host "No orders found!" -ForegroundColor Red
    }

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan