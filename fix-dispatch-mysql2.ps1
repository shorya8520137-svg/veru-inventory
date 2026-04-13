Write-Host "Fixing dispatchController.js for mysql2 compatibility" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$file = "controllers/dispatchController.js"
$content = Get-Content $file -Raw

# Replace db.rollback with connection.rollback
$content = $content -replace 'db\.rollback\(', 'connection.rollback('

# Replace db.commit with connection.commit
$content = $content -replace 'db\.commit\(', 'connection.commit('

# Replace db.query with connection.query (inside transaction blocks)
# This is a bit tricky, but we'll replace all within the createDispatch function
$content = $content -replace '(\s+)db\.query\(', '$1connection.query('

# Add connection.release() before all res.status calls inside transaction
# This ensures connection is released even on errors

# Save the file
Set-Content $file $content

Write-Host "✅ Fixed transaction methods" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "- db.beginTransaction -> connection.beginTransaction" -ForegroundColor White
Write-Host "- db.rollback -> connection.rollback" -ForegroundColor White  
Write-Host "- db.commit -> connection.commit" -ForegroundColor White
Write-Host "- db.query -> connection.query (inside transactions)" -ForegroundColor White
Write-Host ""
Write-Host "Committing and pushing..." -ForegroundColor Cyan

git add controllers/dispatchController.js
git commit -m "Fix: Update dispatchController to use mysql2 connection pool properly"
git push origin stocksphere-clean

Write-Host ""
Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "Run on server:" -ForegroundColor Yellow
Write-Host "cd ~/inventoryfullstack && git pull origin stocksphere-clean && pm2 restart backend" -ForegroundColor White
