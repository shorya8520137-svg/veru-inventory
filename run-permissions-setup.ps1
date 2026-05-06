# Simple script to setup permissions on server
Write-Host "Uploading SQL file to server..." -ForegroundColor Green
scp -i "C:\Users\singh\.ssh\insora.pem" complete-permissions-setup.sql ubuntu@13.62.99.152:/tmp/

Write-Host "Running SQL script on server..." -ForegroundColor Green
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152 "mysql -u inventory_user -p'StrongPass@123' inventory_db < /tmp/complete-permissions-setup.sql"

Write-Host "Verifying setup..." -ForegroundColor Green
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152 "mysql -u inventory_user -p'StrongPass@123' inventory_db -e 'SELECT COUNT(*) as total FROM permissions WHERE is_active = TRUE;'"

Write-Host "Showing breakdown..." -ForegroundColor Green
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152 "mysql -u inventory_user -p'StrongPass@123' inventory_db -e 'SELECT feature_section, COUNT(*) as count FROM permissions WHERE is_active = TRUE GROUP BY feature_section;'"

Write-Host "Cleanup..." -ForegroundColor Green
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152 "rm /tmp/complete-permissions-setup.sql"

Write-Host "DONE! Permissions setup complete!" -ForegroundColor Cyan
