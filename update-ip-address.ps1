# Script to update IP address from old to new across the project
# Run this after closing all open files in your editor

$OLD_IP = "54.169.31.95"
$NEW_IP = "47.129.8.24"

Write-Host "🔄 Updating IP address from $OLD_IP to $NEW_IP..." -ForegroundColor Cyan

# Files to update
$filesToUpdate = @(
    "src/app/api/page.jsx",
    "src/app/security/page.jsx",
    "src/app/profile/page-new.jsx",
    "src/app/api-keys/page.jsx"
)

$updatedCount = 0

foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        Write-Host "📝 Updating $file..." -ForegroundColor Yellow
        try {
            $content = Get-Content $file -Raw
            $newContent = $content -replace [regex]::Escape($OLD_IP), $NEW_IP
            
            if ($content -ne $newContent) {
                Set-Content -Path $file -Value $newContent -NoNewline
                $updatedCount++
                Write-Host "   ✅ Updated successfully" -ForegroundColor Green
            } else {
                Write-Host "   ℹ️  No changes needed" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   ❌ Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "   ⚠️  File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Update complete! Updated $updatedCount file(s)" -ForegroundColor Green
Write-Host "🔍 New IP address: $NEW_IP" -ForegroundColor Cyan
