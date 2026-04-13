#!/usr/bin/env pwsh

# Deploy Product Images Fix and Test API
# This script deploys the backend fix and tests the API response

$SERVER_IP = "13.212.38.57"
$PEM_FILE = "C:\Users\Public\e2c.pem.pem"
$PROJECT_PATH = "/home/ubuntu/inventoryfullstack"
$BACKEND_CONTROLLER = "controllers/websiteProductController.js"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy Product Images Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Copy the updated controller to the server
Write-Host "`n[1/4] Copying updated controller to server..." -ForegroundColor Yellow
try {
    scp -i $PEM_FILE $BACKEND_CONTROLLER "ubuntu@${SERVER_IP}:${PROJECT_PATH}/${BACKEND_CONTROLLER}"
    Write-Host "Controller copied successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to copy controller: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Restart Node.js server
Write-Host "`n[2/4] Restarting Node.js server..." -ForegroundColor Yellow
try {
    ssh -i $PEM_FILE "ubuntu@${SERVER_IP}" "cd $PROJECT_PATH; pkill -f 'node server.js'; sleep 2; nohup node server.js > server.log 2>&1 &; sleep 3; echo 'Node server started'"
    Write-Host "Node.js server restarted" -ForegroundColor Green
} catch {
    Write-Host "Failed to restart server: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Wait for server to be ready
Write-Host "`n[3/4] Waiting for server to be ready..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://${SERVER_IP}:5000/api/website/products?limit=1" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "Server is ready" -ForegroundColor Green
        }
    } catch {
        $attempt++
        Write-Host "  Attempt $attempt/$maxAttempts - Server not ready yet, waiting..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $serverReady) {
    Write-Host "Server failed to start after $maxAttempts attempts" -ForegroundColor Red
    exit 1
}

# Step 4: Test API response
Write-Host "`n[4/4] Testing API response..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${SERVER_IP}:5000/api/website/products?limit=1" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success -and $data.data.Count -gt 0) {
        $product = $data.data[0]
        Write-Host "`nAPI Response Received:" -ForegroundColor Green
        Write-Host "  Product ID: $($product.id)" -ForegroundColor Cyan
        Write-Host "  Product Name: $($product.product_name)" -ForegroundColor Cyan
        Write-Host "  Image URL: $($product.image_url)" -ForegroundColor Cyan
        
        if ($product.additional_images) {
            Write-Host "  Additional Images: $($product.additional_images)" -ForegroundColor Green
            Write-Host "`nSUCCESS: additional_images field is being returned!" -ForegroundColor Green
        } else {
            Write-Host "  Additional Images: NOT FOUND" -ForegroundColor Red
            Write-Host "`nWARNING: additional_images field is missing from API response" -ForegroundColor Yellow
        }
        
        Write-Host "`nFull Product Object:" -ForegroundColor Cyan
        $product | ConvertTo-Json -Depth 10 | Write-Host
    } else {
        Write-Host "No products found in API response" -ForegroundColor Red
    }
} catch {
    Write-Host "Failed to test API: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run build" -ForegroundColor White
Write-Host "2. Deploy frontend to Vercel" -ForegroundColor White
Write-Host "3. Test in browser - click product image to see modal with all images" -ForegroundColor White
