# Setup Store Timeline via SSH
# This script connects to your production server and sets up the timeline table

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Store Timeline Setup (via SSH)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load SSH credentials from .env.production
if (Test-Path ".env.production") {
    Get-Content ".env.production" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$SSH_HOST = $env:SSH_HOST
$SSH_USER = $env:SSH_USER
$SSH_KEY_PATH = $env:SSH_KEY_PATH
$DB_NAME = $env:DB_NAME

if (-not $SSH_HOST) {
    Write-Host "Enter SSH details:" -ForegroundColor Yellow
    $SSH_HOST = Read-Host "SSH Host (e.g., your-server.com)"
    $SSH_USER = Read-Host "SSH User (e.g., root)"
    $DB_NAME = Read-Host "Database Name"
}

Write-Host ""
Write-Host "Connecting to: $SSH_USER@$SSH_HOST" -ForegroundColor Cyan
Write-Host ""

# Create the SQL commands
$sqlCommands = @"
-- Create store_timeline table
CREATE TABLE IF NOT EXISTS store_timeline (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_code VARCHAR(100) NOT NULL,
  product_barcode VARCHAR(255) NOT NULL,
  product_name VARCHAR(255),
  movement_type ENUM('OPENING', 'SELF_TRANSFER', 'DISPATCH', 'RETURN', 'DAMAGE', 'RECOVER', 'MANUAL') NOT NULL,
  direction ENUM('IN', 'OUT') NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  balance_after INT UNSIGNED NOT NULL,
  reference VARCHAR(255),
  user_id VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_store_product (store_code, product_barcode),
  INDEX idx_created_at (created_at),
  INDEX idx_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Populate with existing store inventory
INSERT INTO store_timeline (
    store_code, product_barcode, product_name, movement_type, direction,
    quantity, balance_after, reference, user_id, created_at
)
SELECT 
    'STORE_DEFAULT', barcode, product_name, 'OPENING', 'IN',
    stock, stock, 'INITIAL_STOCK', 'system', created_at
FROM store_inventory
WHERE stock > 0
AND NOT EXISTS (
    SELECT 1 FROM store_timeline st 
    WHERE st.product_barcode = store_inventory.barcode 
    AND st.movement_type = 'OPENING'
)
LIMIT 1000;

-- Show results
SELECT COUNT(*) as total_entries FROM store_timeline;
"@

# Save SQL to temp file
$tempSqlFile = "temp_setup_timeline.sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Host "Uploading SQL script..." -ForegroundColor Yellow

# Upload and execute via SSH
if ($SSH_KEY_PATH) {
    # Using SSH key
    scp -i $SSH_KEY_PATH $tempSqlFile "${SSH_USER}@${SSH_HOST}:/tmp/setup_timeline.sql"
    ssh -i $SSH_KEY_PATH "${SSH_USER}@${SSH_HOST}" "mysql $DB_NAME < /tmp/setup_timeline.sql && rm /tmp/setup_timeline.sql"
} else {
    # Using password
    scp $tempSqlFile "${SSH_USER}@${SSH_HOST}:/tmp/setup_timeline.sql"
    ssh "${SSH_USER}@${SSH_HOST}" "mysql $DB_NAME < /tmp/setup_timeline.sql && rm /tmp/setup_timeline.sql"
}

# Clean up local temp file
Remove-Item $tempSqlFile -Force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Store timeline setup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Timeline table created and populated with existing inventory." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Restart your Node.js application" -ForegroundColor Cyan
    Write-Host "2. Navigate to Store Inventory page" -ForegroundColor Cyan
    Write-Host "3. Timeline should now show existing stock as 'Initial Stock' entries" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Setup failed" -ForegroundColor Red
    Write-Host "Please check SSH connection and database credentials" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
