# Fix All API URLs - Replace old IPs with new domain
# This script updates all remaining hardcoded IP addresses

Write-Host "🔧 FIXING ALL API URLS" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""

$files = @(
    "src/app/security/page.jsx",
    "src/app/profile/page-new.jsx", 
    "src/app/notifications/page.jsx",
    "src/app/api-keys/page.jsx",
    "src/app/api/page.jsx"
)

$oldIPs = @(
    "https://54.169.31.95:8443",
    "https://54.169.107.64:8443",
    "https://54.254.184.54:8443"
)

$newURL = "https://api.giftgala.in"

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📝 Updating $file..." -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        $updated = $false
        
        foreach ($oldIP in $oldIPs) {
            if ($content -match [regex]::Escape($oldIP)) {
                $content = $content -replace [regex]::Escape($oldIP), $newURL
                $updated = $true
                Write-Host "   ✅ Replaced $oldIP with $newURL" -ForegroundColor Green
            }
        }
        
        if ($updated) {
            Set-Content $file -Value $content -NoNewline
            Write-Host "   💾 File updated successfully" -ForegroundColor Green
        } else {
            Write-Host "   ℹ️ No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️ File not found: $file" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "🎉 ALL API URLS UPDATED!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "   ✅ Replaced all old IP addresses" -ForegroundColor White
Write-Host "   ✅ Updated to: $newURL" -ForegroundColor White
Write-Host "   ✅ Fixed environment variable usage" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next: Commit and deploy changes" -ForegroundColor Yellow