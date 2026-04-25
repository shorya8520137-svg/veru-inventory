# Analyze database directly on server (no download needed)

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "Analyzing database directly on server..." -ForegroundColor Cyan
Write-Host ""

# Get all tables
Write-Host "=== ALL TABLES ===" -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SHOW TABLES;'"

Write-Host ""
Write-Host "=== TABLE SIZES ===" -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "
SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size_MB'
FROM information_schema.tables 
WHERE table_schema = 'inventory_db' 
ORDER BY table_rows DESC;
"
"@

Write-Host ""
Write-Host "=== INVENTORY RELATED TABLES ===" -ForegroundColor Yellow
ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "
SELECT 
    table_name,
    table_rows
FROM information_schema.tables 
WHERE table_schema = 'inventory_db' 
AND (table_name LIKE '%inventory%' 
     OR table_name LIKE '%timeline%' 
     OR table_name LIKE '%transfer%' 
     OR table_name LIKE '%stock%'
     OR table_name LIKE '%batch%')
ORDER BY table_rows DESC;
"
"@

Write-Host ""
Write-Host "Done! Now we know which tables to empty." -ForegroundColor Green