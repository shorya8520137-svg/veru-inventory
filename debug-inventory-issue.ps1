# Debug inventory synchronization issue

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

Write-Host "=== DEBUGGING INVENTORY SYNCHRONIZATION ISSUE ===" -ForegroundColor Red
Write-Host ""

# Check the specific product that's causing issues
$barcode = "688359513495"

Write-Host "1. CHECKING INVENTORY_LEDGER_BASE for barcode: $barcode" -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT event_time, movement_type, barcode, product_name, location_code, qty, direction, reference FROM inventory_ledger_base WHERE barcode = \"$barcode\" ORDER BY event_time DESC LIMIT 10;'"

Write-Host ""
Write-Host "2. CHECKING STOCK_BATCHES for barcode: $barcode" -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT id, barcode, product_name, warehouse, qty_available, status, created_at FROM stock_batches WHERE barcode = \"$barcode\";'"

Write-Host ""
Write-Host "3. CHECKING SELF_TRANSFER table" -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT id, transfer_reference, transfer_type, source_location, destination_location, status, created_at FROM self_transfer ORDER BY created_at DESC LIMIT 5;'"

Write-Host ""
Write-Host "4. CHECKING SELF_TRANSFER_ITEMS" -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT sti.id, sti.transfer_id, sti.product_name, sti.barcode, sti.qty, st.transfer_reference FROM self_transfer_items sti JOIN self_transfer st ON sti.transfer_id = st.id WHERE sti.barcode = \"$barcode\" ORDER BY sti.id DESC;'"

Write-Host ""
Write-Host "5. CHECKING INVENTORY table for barcode: $barcode" -ForegroundColor Yellow
ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT id, product, code, warehouse, quantity, last_updated FROM inventory WHERE code = \"$barcode\";'"

Write-Host ""
Write-Host "=== ANALYSIS COMPLETE ===" -ForegroundColor Green