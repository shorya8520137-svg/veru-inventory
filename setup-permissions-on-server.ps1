# ============================================================================
# SETUP PERMISSIONS ON SERVER
# Connects to AWS server and runs the complete permissions setup SQL
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PERMISSIONS SETUP ON SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SSH_KEY = "C:\Users\singh\.ssh\insora.pem"
$SERVER = "ubuntu@13.62.99.152"
$DB_USER = "inventory_user"
$DB_PASS = "StrongPass@123"
$DB_NAME = "inventory_db"
$SQL_FILE = "complete-permissions-setup.sql"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Server: $SERVER" -ForegroundColor Gray
Write-Host "   Database: $DB_NAME" -ForegroundColor Gray
Write-Host "   SQL File: $SQL_FILE" -ForegroundColor Gray
Write-Host ""

# Step 1: Upload SQL file to server
Write-Host "📤 Step 1: Uploading SQL file to server..." -ForegroundColor Green
try {
    scp -i $SSH_KEY $SQL_FILE "${SERVER}:/tmp/$SQL_FILE"
    Write-Host "   ✅ SQL file uploaded successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to upload SQL file: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Run SQL script on server
Write-Host "🗄️  Step 2: Running SQL script on database..." -ForegroundColor Green
Write-Host "   This will:" -ForegroundColor Gray
Write-Host "   - Create 120+ permissions" -ForegroundColor Gray
Write-Host "   - Generate dynamic warehouse permissions" -ForegroundColor Gray
Write-Host "   - Set up auto-sync triggers" -ForegroundColor Gray
Write-Host ""

$SQL_COMMAND = @"
mysql -u $DB_USER -p'$DB_PASS' $DB_NAME < /tmp/$SQL_FILE
"@

try {
    ssh -i $SSH_KEY $SERVER $SQL_COMMAND
    Write-Host "   ✅ SQL script executed successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to execute SQL script: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Verify permissions count
Write-Host "🔍 Step 3: Verifying permissions setup..." -ForegroundColor Green

$VERIFY_COMMAND = @"
mysql -u $DB_USER -p'$DB_PASS' $DB_NAME -e "SELECT COUNT(*) as total_permissions FROM permissions WHERE is_active = TRUE;"
"@

try {
    ssh -i $SSH_KEY $SERVER $VERIFY_COMMAND
    Write-Host "   ✅ Verification complete" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not verify: $_" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Show permissions by category
Write-Host "📊 Step 4: Permissions breakdown by category..." -ForegroundColor Green

$BREAKDOWN_COMMAND = @"
mysql -u $DB_USER -p'$DB_PASS' $DB_NAME -e "SELECT feature_section, COUNT(*) as count FROM permissions WHERE is_active = TRUE GROUP BY feature_section ORDER BY feature_section;"
"@

try {
    ssh -i $SSH_KEY $SERVER $BREAKDOWN_COMMAND
    Write-Host "   ✅ Breakdown complete" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not get breakdown: $_" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Cleanup
Write-Host "🧹 Step 5: Cleaning up temporary files..." -ForegroundColor Green

$CLEANUP_COMMAND = "rm /tmp/$SQL_FILE"

try {
    ssh -i $SSH_KEY $SERVER $CLEANUP_COMMAND
    Write-Host "   ✅ Cleanup complete" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not cleanup: $_" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Your permissions system is now ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open your frontend at https://yourdomain.com/permissions" -ForegroundColor Gray
Write-Host "2. Click 'Create Role' or 'Edit Role'" -ForegroundColor Gray
Write-Host "3. You'll see the new tab-based UI with warehouse dropdown" -ForegroundColor Gray
Write-Host "4. Select warehouses from the dropdown" -ForegroundColor Gray
Write-Host "5. Assign permissions per warehouse" -ForegroundColor Gray
Write-Host ""
Write-Host "🔥 The frontend is already updated and ready to use!" -ForegroundColor Cyan
Write-Host ""
