#!/usr/bin/env pwsh

Write-Host "Testing API directly..." -ForegroundColor Green

$API_URL = "https://13.212.51.226:8443/api/website/orders?page=1&limit=3"

try {
    Write-Host "Making request to: $API_URL" -ForegroundColor Yellow
    
    # Test without authentication first
    $response = Invoke-RestMethod -Uri $API_URL -Method GET -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "API Response received!" -ForegroundColor Green
    Write-Host "Success: $($response.success)" -ForegroundColor Cyan
    
    if ($response.data -and $response.data.orders) {
        $orders = $response.data.orders
        Write-Host "Found $($orders.Count) orders" -ForegroundColor Green
        
        foreach ($order in $orders) {
            Write-Host "----------------------------------------" -ForegroundColor Yellow
            Write-Host "Order: $($order.order_number)" -ForegroundColor White
            Write-Host "Customer: $($order.customer_name)" -ForegroundColor White
            Write-Host "Amount: $($order.currency)$($order.total_amount)" -ForegroundColor White
            Write-Host "Item Count: $($order.item_count)" -ForegroundColor White
            
            if ($order.products -and $order.products.Count -gt 0) {
                Write-Host "Products:" -ForegroundColor Green
                foreach ($product in $order.products) {
                    Write-Host "  - $($product.product_name) (Qty: $($product.quantity))" -ForegroundColor Green
                }
            } else {
                Write-Host "Products: NONE FOUND!" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No orders found in response" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full error: $_" -ForegroundColor Red
}