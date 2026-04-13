Write-Host "Opening HTML file that connects directly to new IP..." -ForegroundColor Cyan
Write-Host "This bypasses Vercel's cache completely" -ForegroundColor Yellow
Write-Host ""
Write-Host "The HTML file will connect to: https://54.251.22.246:8443" -ForegroundColor Green
Write-Host ""
Write-Host "If you see 'Failed to fetch' in browser console:" -ForegroundColor Yellow
Write-Host "1. Check backend is running: pm2 status" -ForegroundColor White
Write-Host "2. Check Nginx is running: sudo systemctl status nginx" -ForegroundColor White
Write-Host "3. Check port 8443 is open in firewall" -ForegroundColor White
Write-Host ""

Start-Process "website-orders-complete.html"

Write-Host "HTML file opened in browser!" -ForegroundColor Green
Write-Host ""
Write-Host "To fix Vercel (for the React app):" -ForegroundColor Cyan
Write-Host "1. Update Vercel environment variable:" -ForegroundColor White
Write-Host "   vercel env add NEXT_PUBLIC_API_BASE" -ForegroundColor Gray
Write-Host "   Enter: https://54.251.22.246:8443" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy with environment variable:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "OR create a new Vercel project to bypass cache completely" -ForegroundColor Yellow
