# ============================================
# INVENTORY MANAGEMENT MASTER SCRIPT
# ============================================
# This script provides a menu to:
# 1. Download database backup
# 2. Analyze inventory tables
# 3. Empty inventory system
# ============================================

$sshHost = "ubuntu@13.212.82.15"
$sshKey = "C:\Users\singh\.ssh\pem.pem"

function Show-Menu {
    Clear-Host
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "   INVENTORY MANAGEMENT MASTER SCRIPT" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Server: $sshHost" -ForegroundColor White
    Write-Host "Database: inventory_db" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Download Database Backup" -ForegroundColor Green
    Write-Host "2. Analyze Inventory Tables" -ForegroundColor Yellow
    Write-Host "3. Empty Inventory System (⚠️  DESTRUCTIVE)" -ForegroundColor Red
    Write-Host "4. Full Workflow (Backup → Analyze → Empty)" -ForegroundColor Magenta
    Write-Host "5. Exit" -ForegroundColor Gray
    Write-Host ""
}

function Download-Database {
    Write-Host ""
    Write-Host "📥 DOWNLOADING DATABASE BACKUP..." -ForegroundColor Cyan
    Write-Host "=" * 80
    Write-Host ""
    
    $outputFile = "inventory_db_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    $dumpCommand = "sudo mysqldump -u root inventory_db > /tmp/inventory_backup.sql && cat /tmp/inventory_backup.sql"
    
    Write-Host "Executing mysqldump on server..." -ForegroundColor Yellow
    
    ssh -i $sshKey $sshHost $dumpCommand | Out-File -FilePath $outputFile -Encoding UTF8
    
    if (Test-Path $outputFile) {
        $fileSize = (Get-Item $outputFile).Length / 1MB
        Write-Host ""
        Write-Host "✅ Database downloaded successfully!" -ForegroundColor Green
        Write-Host "📁 File: $outputFile" -ForegroundColor White
        Write-Host "📊 Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
        Write-Host ""
        Write-Host "🧹 Cleaning up server temp file..." -ForegroundColor Yellow
        ssh -i $sshKey $sshHost "sudo rm /tmp/inventory_backup.sql"
        Write-Host "✅ Done!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Failed to download database!" -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Analyze-Tables {
    Write-Host ""
    Write-Host "🔍 ANALYZING INVENTORY TABLES..." -ForegroundColor Cyan
    Write-Host "=" * 80
    Write-Host ""
    
    # Get all tables
    Write-Host "📋 All Tables in inventory_db:" -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SHOW TABLES;'"
    
    Write-Host ""
    Write-Host "=" * 80
    Write-Host ""
    
    # Analyze inventory table
    Write-Host "📦 INVENTORY Table:" -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT COUNT(*) as total_rows FROM inventory;'"
    
    Write-Host ""
    
    # Analyze timeline table
    Write-Host "⏱️  TIMELINE Table:" -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT COUNT(*) as total_rows FROM timeline;'"
    
    Write-Host ""
    
    # Analyze self_transfer table
    Write-Host "🔄 SELF_TRANSFER Table:" -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT COUNT(*) as total_rows FROM self_transfer;'"
    
    Write-Host ""
    
    # Analyze stock_batches table
    Write-Host "📦 STOCK_BATCHES Table:" -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT COUNT(*) as total_rows FROM stock_batches;'"
    
    Write-Host ""
    
    # Analyze store_inventory table
    Write-Host "🏪 STORE_INVENTORY Table:" -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo mysql inventory_db -e 'SELECT COUNT(*) as total_rows FROM store_inventory;'"
    
    Write-Host ""
    Write-Host "✅ Analysis Complete!" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Empty-Inventory {
    Write-Host ""
    Write-Host "⚠️  EMPTY INVENTORY SYSTEM" -ForegroundColor Red
    Write-Host "=" * 80
    Write-Host ""
    Write-Host "⚠️  WARNING: This will EMPTY all inventory-related tables!" -ForegroundColor Red
    Write-Host "Tables to be emptied:" -ForegroundColor Yellow
    Write-Host "  - inventory" -ForegroundColor White
    Write-Host "  - timeline" -ForegroundColor White
    Write-Host "  - self_transfer" -ForegroundColor White
    Write-Host "  - stock_batches" -ForegroundColor White
    Write-Host "  - store_inventory" -ForegroundColor White
    Write-Host ""
    
    $confirmation = Read-Host "Type 'YES' to proceed with emptying inventory system"
    
    if ($confirmation -ne "YES") {
        Write-Host "❌ Operation cancelled." -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to continue"
        return
    }
    
    Write-Host ""
    Write-Host "📤 Uploading SQL script to server..." -ForegroundColor Cyan
    
    # Upload the SQL file to server
    scp -i $sshKey "empty-inventory-system.sql" "${sshHost}:/tmp/empty-inventory-system.sql"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to upload SQL file!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to continue"
        return
    }
    
    Write-Host "✅ SQL file uploaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🗑️  Executing empty inventory script on server..." -ForegroundColor Yellow
    Write-Host ""
    
    # Execute the SQL script on server
    ssh -i $sshKey $sshHost "sudo mysql inventory_db < /tmp/empty-inventory-system.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Inventory system emptied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🧹 Cleaning up temp file on server..." -ForegroundColor Yellow
        ssh -i $sshKey $sshHost "sudo rm /tmp/empty-inventory-system.sql"
        Write-Host "✅ Done!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Failed to execute SQL script!" -ForegroundColor Red
        Write-Host "Temp file location: /tmp/empty-inventory-system.sql" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "📊 Verifying table counts..." -ForegroundColor Cyan
    Write-Host ""
    
    # Verify the tables are empty
    ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "
SELECT 
    'inventory' as table_name, COUNT(*) as row_count FROM inventory
UNION ALL
SELECT 
    'timeline' as table_name, COUNT(*) as row_count FROM timeline
UNION ALL
SELECT 
    'self_transfer' as table_name, COUNT(*) as row_count FROM self_transfer
UNION ALL
SELECT 
    'stock_batches' as table_name, COUNT(*) as row_count FROM stock_batches
UNION ALL
SELECT 
    'store_inventory' as table_name, COUNT(*) as row_count FROM store_inventory;
"
"@
    
    Write-Host ""
    Write-Host "✅ Operation completed!" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Full-Workflow {
    Write-Host ""
    Write-Host "🔄 FULL WORKFLOW: BACKUP → ANALYZE → EMPTY" -ForegroundColor Magenta
    Write-Host "=" * 80
    Write-Host ""
    
    # Step 1: Download backup
    Write-Host "STEP 1/3: Downloading database backup..." -ForegroundColor Cyan
    $outputFile = "inventory_db_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    $dumpCommand = "sudo mysqldump -u root inventory_db > /tmp/inventory_backup.sql && cat /tmp/inventory_backup.sql"
    
    ssh -i $sshKey $sshHost $dumpCommand | Out-File -FilePath $outputFile -Encoding UTF8
    
    if (Test-Path $outputFile) {
        $fileSize = (Get-Item $outputFile).Length / 1MB
        Write-Host "✅ Backup saved: $outputFile ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
        ssh -i $sshKey $sshHost "sudo rm /tmp/inventory_backup.sql"
    } else {
        Write-Host "❌ Backup failed! Aborting workflow." -ForegroundColor Red
        Read-Host "Press Enter to continue"
        return
    }
    
    Write-Host ""
    
    # Step 2: Analyze tables
    Write-Host "STEP 2/3: Analyzing current table counts..." -ForegroundColor Cyan
    ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "
SELECT 
    'inventory' as table_name, COUNT(*) as row_count FROM inventory
UNION ALL
SELECT 
    'timeline' as table_name, COUNT(*) as row_count FROM timeline
UNION ALL
SELECT 
    'self_transfer' as table_name, COUNT(*) as row_count FROM self_transfer
UNION ALL
SELECT 
    'stock_batches' as table_name, COUNT(*) as row_count FROM stock_batches
UNION ALL
SELECT 
    'store_inventory' as table_name, COUNT(*) as row_count FROM store_inventory;
"
"@
    
    Write-Host ""
    
    # Step 3: Empty inventory
    Write-Host "STEP 3/3: Emptying inventory system..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  WARNING: This will EMPTY all inventory-related tables!" -ForegroundColor Red
    Write-Host ""
    
    $confirmation = Read-Host "Type 'YES' to proceed with emptying inventory system"
    
    if ($confirmation -ne "YES") {
        Write-Host "❌ Operation cancelled." -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to continue"
        return
    }
    
    Write-Host ""
    Write-Host "📤 Uploading SQL script..." -ForegroundColor Yellow
    scp -i $sshKey "empty-inventory-system.sql" "${sshHost}:/tmp/empty-inventory-system.sql"
    
    Write-Host "🗑️  Executing empty script..." -ForegroundColor Yellow
    ssh -i $sshKey $sshHost "sudo mysql inventory_db < /tmp/empty-inventory-system.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Inventory emptied successfully!" -ForegroundColor Green
        ssh -i $sshKey $sshHost "sudo rm /tmp/empty-inventory-system.sql"
        
        Write-Host ""
        Write-Host "📊 Final verification:" -ForegroundColor Cyan
        ssh -i $sshKey $sshHost @"
sudo mysql inventory_db -e "
SELECT 
    'inventory' as table_name, COUNT(*) as row_count FROM inventory
UNION ALL
SELECT 
    'timeline' as table_name, COUNT(*) as row_count FROM timeline
UNION ALL
SELECT 
    'self_transfer' as table_name, COUNT(*) as row_count FROM self_transfer
UNION ALL
SELECT 
    'stock_batches' as table_name, COUNT(*) as row_count FROM stock_batches
UNION ALL
SELECT 
    'store_inventory' as table_name, COUNT(*) as row_count FROM store_inventory;
"
"@
        Write-Host ""
        Write-Host "✅ Full workflow completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to empty inventory!" -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Select an option (1-5)"
    
    switch ($choice) {
        "1" { Download-Database }
        "2" { Analyze-Tables }
        "3" { Empty-Inventory }
        "4" { Full-Workflow }
        "5" { 
            Write-Host ""
            Write-Host "👋 Goodbye!" -ForegroundColor Cyan
            Write-Host ""
            exit 
        }
        default {
            Write-Host ""
            Write-Host "❌ Invalid option. Please select 1-5." -ForegroundColor Red
            Write-Host ""
            Start-Sleep -Seconds 2
        }
    }
} while ($true)
