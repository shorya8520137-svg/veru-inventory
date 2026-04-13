#!/usr/bin/env pwsh

Write-Host "=== Testing Website Orders API ===" -ForegroundColor Cyan

$url = "http://18.141.230.43:5000/api/website/orders?page=1&limit=5"

Write-Host "`nFetching orders from: $url" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
        "Content-Type" = "application/json"
    }
    
    Write-Host "`nAPI Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    
    Write-Host "`n=== Order Details ===" -ForegroundColor Cyan
    foreach ($order in $response.data.orders) {
        Write-Host "`nOrder: $($order.order_number)" -ForegroundColor Yellow
        Write-Host "  Customer: $($order.customer_name)" -ForegroundColor White
        Write-Host "  Email: $($order.customer_email)" -ForegroundColor White
        Write-Host "  Phone: $($order.customer_phone)" -ForegroundColor White
    }
    
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
