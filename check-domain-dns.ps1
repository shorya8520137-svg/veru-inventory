Write-Host "Checking api.giftgala.in DNS and connectivity" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check DNS resolution
Write-Host "`n1. DNS Resolution:" -ForegroundColor Yellow
try {
    $dns = Resolve-DnsName api.giftgala.in -ErrorAction Stop
    Write-Host "   ✅ Domain resolves to: $($dns.IPAddress)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ DNS resolution failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check if port 443 is open
Write-Host "`n2. Testing HTTPS (port 443):" -ForegroundColor Yellow
try {
    $test = Test-NetConnection api.giftgala.in -Port 443 -WarningAction SilentlyContinue
    if ($test.TcpTestSucceeded) {
        Write-Host "   ✅ Port 443 is open" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Port 443 is closed or blocked" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Connection test failed" -ForegroundColor Red
}

# Try to reach the API
Write-Host "`n3. Testing API endpoint:" -ForegroundColor Yellow
try {
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
    
    $response = Invoke-WebRequest -Uri "https://api.giftgala.in/api/website/orders" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ API is responding! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API not responding: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n   Possible issues:" -ForegroundColor Yellow
    Write-Host "   - Nginx not configured for api.giftgala.in domain" -ForegroundColor White
    Write-Host "   - SSL certificate not set up for the domain" -ForegroundColor White
    Write-Host "   - Backend server not running" -ForegroundColor White
    Write-Host "   - Firewall blocking port 443" -ForegroundColor White
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. SSH to server: ssh ubuntu@54.251.22.246" -ForegroundColor White
Write-Host "2. Check Nginx config: sudo nano /etc/nginx/sites-available/default" -ForegroundColor White
Write-Host "3. Check backend: pm2 status" -ForegroundColor White
Write-Host "4. Check Nginx: sudo systemctl status nginx" -ForegroundColor White
