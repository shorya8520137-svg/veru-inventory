#!/usr/bin/env pwsh

Write-Host "=== VERCEL CACHE BUG FIX TOOL ===" -ForegroundColor Cyan
Write-Host "This script will diagnose and fix Vercel caching issues" -ForegroundColor Yellow

# Step 1: Analyze the problem
Write-Host "`n1. ANALYZING THE VERCEL CACHING BUG..." -ForegroundColor Green
Write-Host "   - HTML works = API is perfect" -ForegroundColor White
Write-Host "   - React doesn't work = JavaScript is cached" -ForegroundColor White
Write-Host "   - Console is blank = Old JS files being served" -ForegroundColor White

# Step 2: Check current deployment
Write-Host "`n2. CHECKING CURRENT VERCEL DEPLOYMENT..." -ForegroundColor Green
try {
    $vercelStatus = vercel ls
    Write-Host "Current deployments:" -ForegroundColor Yellow
    Write-Host $vercelStatus -ForegroundColor White
} catch {
    Write-Host "Could not get Vercel status: $_" -ForegroundColor Red
}

# Step 3: Force cache invalidation techniques
Write-Host "`n3. APPLYING CACHE INVALIDATION TECHNIQUES..." -ForegroundColor Green

# Technique 1: Add cache-busting timestamp to all files
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
Write-Host "   Adding cache-bust timestamp: $timestamp" -ForegroundColor Yellow

# Add timestamp comment to force rebuild
$cacheBustComment = "// CACHE BUST: $timestamp - Force Vercel rebuild"
Add-Content -Path "src/app/order/websiteorder/websiteorder.jsx" -Value "`n$cacheBustComment"

# Technique 2: Update Next.js config for cache control
$nextConfigPath = "next.config.js"
if (Test-Path $nextConfigPath) {
    Write-Host "   Updating Next.js config for cache control..." -ForegroundColor Yellow
    $cacheConfig = @"

// Cache busting configuration - $timestamp
module.exports = {
  ...module.exports,
  generateEtags: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ]
  }
}
"@
    Add-Content -Path $nextConfigPath -Value $cacheConfig
} else {
    Write-Host "   Creating Next.js config for cache control..." -ForegroundColor Yellow
    $newNextConfig = @"
// Next.js configuration with cache busting - $timestamp
module.exports = {
  generateEtags: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0'
          }
        ]
      }
    ]
  }
}
"@
    Set-Content -Path $nextConfigPath -Value $newNextConfig
}

# Technique 3: Update package.json build script
Write-Host "   Updating build configuration..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if (-not $packageJson.scripts) {
        $packageJson | Add-Member -Type NoteProperty -Name "scripts" -Value @{}
    }
    $packageJson.scripts.build = "next build --no-cache"
    $packageJson.scripts."build:force" = "rm -rf .next && next build"
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
}

# Step 4: Clean local build
Write-Host "`n4. CLEANING LOCAL BUILD..." -ForegroundColor Green
if (Test-Path ".next") {
    Write-Host "   Removing .next directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next"
}

if (Test-Path "node_modules/.cache") {
    Write-Host "   Removing Node.js cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules/.cache"
}

# Step 5: Git commit with force flag
Write-Host "`n5. COMMITTING CHANGES..." -ForegroundColor Green
git add .
git commit -m "FORCE CACHE INVALIDATION - $timestamp"

# Step 6: Deploy with multiple strategies
Write-Host "`n6. DEPLOYING WITH CACHE INVALIDATION..." -ForegroundColor Green

Write-Host "   Strategy 1: Force production deployment..." -ForegroundColor Yellow
try {
    vercel --prod --force --yes
    Write-Host "   ✅ Force deployment completed" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Force deployment failed: $_" -ForegroundColor Red
}

Write-Host "   Strategy 2: Deploy with environment variable..." -ForegroundColor Yellow
try {
    vercel --prod --env CACHE_BUST=$timestamp
    Write-Host "   ✅ Environment deployment completed" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Environment deployment failed: $_" -ForegroundColor Red
}

# Step 7: Purge CDN cache
Write-Host "`n7. PURGING CDN CACHE..." -ForegroundColor Green
Write-Host "   Note: Vercel doesn't provide direct cache purge API" -ForegroundColor Yellow
Write-Host "   Using deployment-based cache invalidation" -ForegroundColor Yellow

# Step 8: Create cache-busted URLs
Write-Host "`n8. GENERATING CACHE-BUSTED URLS..." -ForegroundColor Green
$baseUrls = @(
    "https://inventoryfullstack-one.vercel.app",
    "https://inventoryfullstack-1nrovddte-test-tests-projects-d6b8ba0b.vercel.app"
)

Write-Host "   Cache-busted URLs to test:" -ForegroundColor Yellow
foreach ($url in $baseUrls) {
    $cacheBustUrl = "$url/order/websiteorder?cb=$timestamp&v=$(Get-Random)&nocache=true"
    Write-Host "   🔗 $cacheBustUrl" -ForegroundColor Cyan
}

# Step 9: Alternative solutions
Write-Host "`n9. ALTERNATIVE SOLUTIONS..." -ForegroundColor Green
Write-Host "   A. Use the HTML version (orders-standalone.html)" -ForegroundColor White
Write-Host "   B. Deploy to different platform (Netlify, Railway)" -ForegroundColor White
Write-Host "   C. Use Vercel preview deployments instead of production" -ForegroundColor White
Write-Host "   D. Implement client-side cache busting" -ForegroundColor White

# Step 10: Testing instructions
Write-Host "`n10. TESTING INSTRUCTIONS..." -ForegroundColor Green
Write-Host "   1. Wait 2-3 minutes for deployment to propagate" -ForegroundColor White
Write-Host "   2. Open incognito/private browser window" -ForegroundColor White
Write-Host "   3. Go to your orders page" -ForegroundColor White
Write-Host "   4. Press F12 to open console" -ForegroundColor White
Write-Host "   5. Look for debug logs starting with 'FRONTEND DEBUG'" -ForegroundColor White
Write-Host "   6. If no logs appear, caching is still active" -ForegroundColor White

Write-Host "`n=== VERCEL CACHE FIX COMPLETED ===" -ForegroundColor Cyan
Write-Host "If React still doesn't work, use the HTML version as primary solution" -ForegroundColor Yellow

# Open debug tool
Write-Host "`nOpening debug tool..." -ForegroundColor Green
Start-Process "debug-vercel-cache.html"