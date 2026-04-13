# Test API to check if additional_images are being sent
$apiBase = "https://api.giftgala.in"

Write-Host "=== Testing Website Products API ===" -ForegroundColor Green
Write-Host "API Base: $apiBase" -ForegroundColor Cyan

# Fetch products
Write-Host "`nFetching products..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiBase/api/website/products?limit=5" -Method GET -ContentType "application/json"
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "`nTotal Products: $($data.data.Count)" -ForegroundColor Green
        
        # Check each product for additional_images
        foreach ($product in $data.data) {
            Write-Host "`n--- Product: $($product.product_name) ---" -ForegroundColor Cyan
            Write-Host "ID: $($product.id)" -ForegroundColor White
            Write-Host "Main Image: $($product.image_url)" -ForegroundColor White
            Write-Host "Additional Images: $($product.additional_images)" -ForegroundColor Yellow
            
            if ($product.additional_images) {
                Write-Host "Status: HAS additional_images" -ForegroundColor Green
            } else {
                Write-Host "Status: NO additional_images" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green