# Deploy Google OAuth to Server

Write-Host "🚀 Deploying Google OAuth Integration..." -ForegroundColor Green
Write-Host ""

# Git operations
Write-Host "📦 Committing changes..." -ForegroundColor Yellow
git add config/passport.js
git add routes/googleAuthRoutes.js
git add middleware/jwtAuth.js
git add routes/protectedRoutes.js
git add server.js
git add GOOGLE_OAUTH_SETUP.md
git add install-google-oauth.sh

git commit -m "Add Google OAuth integration with Passport.js and JWT"

Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps on your EC2 server:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. SSH into your server:" -ForegroundColor White
Write-Host "   ssh ubuntu@api.giftgala.in" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Navigate to project directory:" -ForegroundColor White
Write-Host "   cd /home/ubuntu/inventoryfullstack" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Pull latest changes:" -ForegroundColor White
Write-Host "   git pull origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Install new packages:" -ForegroundColor White
Write-Host "   npm install passport passport-google-oauth20" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Add to .env file (if not already there):" -ForegroundColor White
Write-Host "   GOOGLE_CLIENT_ID=your-google-client-id" -ForegroundColor Gray
Write-Host "   GOOGLE_CLIENT_SECRET=your-google-client-secret" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Restart server:" -ForegroundColor White
Write-Host "   pm2 restart all" -ForegroundColor Gray
Write-Host ""
Write-Host "7. Test the integration:" -ForegroundColor White
Write-Host "   curl https://api.giftgala.in/auth/google/status" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 API Endpoints:" -ForegroundColor Cyan
Write-Host "   Start Login: https://api.giftgala.in/auth/google" -ForegroundColor White
Write-Host "   Check Status: https://api.giftgala.in/auth/google/status" -ForegroundColor White
Write-Host ""
