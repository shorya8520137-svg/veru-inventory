#!/bin/bash

# ============================================
# BILLING DATABASE SETUP VIA SSH
# ============================================
# This script connects to the remote server via SSH
# and sets up the complete billing system database
# ============================================

SSH_KEY="C:/Users/Public/e2c.pem.pem"
SERVER="ubuntu@13.212.52.15"
DB_NAME="inventory_db"
SQL_FILE="COMPLETE_BILLING_SETUP.sql"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  BILLING DATABASE SETUP VIA SSH${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "${YELLOW}Server: $SERVER${NC}"
echo -e "${YELLOW}Database: $DB_NAME${NC}"
echo -e "${YELLOW}SQL File: $SQL_FILE${NC}"
echo ""

# Step 1: Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ ERROR: $SQL_FILE not found!${NC}"
    echo -e "${RED}   Please make sure the file exists in the current directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ SQL file found${NC}"
echo ""

# Step 2: Upload SQL file to server
echo -e "${CYAN}📤 Step 1: Uploading SQL file to server...${NC}"
scp -i "$SSH_KEY" "$SQL_FILE" "${SERVER}:/tmp/billing_setup.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SQL file uploaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to upload SQL file${NC}"
    exit 1
fi
echo ""

# Step 3: Execute SQL file on server
echo -e "${CYAN}🔧 Step 2: Executing SQL file on remote database...${NC}"
echo -e "${YELLOW}   This will create all billing tables and insert sample data...${NC}"
echo ""

ssh -i "$SSH_KEY" "$SERVER" "sudo mysql $DB_NAME < /tmp/billing_setup.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SQL file executed successfully${NC}"
else
    echo -e "${RED}❌ Failed to execute SQL file${NC}"
    exit 1
fi
echo ""

# Step 4: Verify tables were created
echo -e "${CYAN}🔍 Step 3: Verifying tables were created...${NC}"
echo ""

cat > temp_verify_billing.sql << 'EOF'
USE inventory_db;

-- Show billing tables
SELECT '=== BILLING TABLES ===' as Info;
SHOW TABLES LIKE '%bill%';

-- Show store inventory tables
SELECT '=== STORE INVENTORY TABLES ===' as Info;
SHOW TABLES LIKE '%store%';

-- Count records
SELECT '=== RECORD COUNTS ===' as Info;
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'store_inventory', COUNT(*) FROM store_inventory
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'store_inventory_logs', COUNT(*) FROM store_inventory_logs;

-- Show sample products
SELECT '=== SAMPLE PRODUCTS ===' as Info;
SELECT product_name, barcode, price, stock FROM store_inventory LIMIT 5;

-- Show table structures
SELECT '=== BILLS TABLE STRUCTURE ===' as Info;
DESCRIBE bills;

SELECT '=== STORE INVENTORY TABLE STRUCTURE ===' as Info;
DESCRIBE store_inventory;
EOF

# Upload and execute verify script
scp -i "$SSH_KEY" "temp_verify_billing.sql" "${SERVER}:/tmp/verify_billing.sql"
ssh -i "$SSH_KEY" "$SERVER" "sudo mysql $DB_NAME < /tmp/verify_billing.sql"

# Clean up temp file
rm -f temp_verify_billing.sql

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✓ BILLING DATABASE SETUP COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${CYAN}📋 What was created:${NC}"
echo -e "   ${GREEN}✓${NC} bills table (stores all invoices)"
echo -e "   ${GREEN}✓${NC} store_inventory table (tracks product stock)"
echo -e "   ${GREEN}✓${NC} store_inventory_logs table (audit trail)"
echo -e "   ${GREEN}✓${NC} products table (master catalog)"
echo -e "   ${GREEN}✓${NC} 15 sample products inserted"
echo ""
echo -e "${CYAN}🚀 Next Steps:${NC}"
echo -e "   1. Access billing system at: /billing/create"
echo -e "   2. View bill history at: /billing/history"
echo -e "   3. Check store inventory at: /billing/store-inventory"
echo ""
echo -e "${CYAN}🔗 API Endpoints:${NC}"
echo -e "   POST /api/billing/generate"
echo -e "   GET  /api/billing/history"
echo -e "   GET  /api/billing/store-inventory"
echo -e "   GET  /api/dispatch/search-products"
echo ""

# Clean up remote temp files
ssh -i "$SSH_KEY" "$SERVER" "rm -f /tmp/billing_setup.sql /tmp/verify_billing.sql"

echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
