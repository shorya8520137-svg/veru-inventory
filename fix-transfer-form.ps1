# Fix self-transfer form - remove static values and ensure submit button is visible

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "Fixing self-transfer form..." -ForegroundColor Cyan
Write-Host ""

# Upload fixed TransferForm component
Write-Host "Uploading fixed TransferForm component..." -ForegroundColor Yellow
scp -i $sshKey "src/app/products/TransferForm.jsx" "${sshHost}:/home/ubuntu/inventoryfullstack/src/app/products/"

Write-Host ""
Write-Host "Transfer form fixes deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "  - Removed static placeholder values (FedEx, Alex Thompson, etc.)" -ForegroundColor White
Write-Host "  - Made transfer ID dynamic (STF-YEAR-XXXX)" -ForegroundColor White
Write-Host "  - Fixed modal height to ensure submit button is always visible" -ForegroundColor White
Write-Host "  - Added proper form footer positioning" -ForegroundColor White
Write-Host ""
Write-Host "The submit button should now be visible and functional!" -ForegroundColor Green