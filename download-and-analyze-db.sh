#!/bin/bash

# Database Download and Analysis Script
# This script downloads the database from the server and analyzes its structure

set -e

echo "=========================================="
echo "Database Download & Analysis Script"
echo "=========================================="

# Configuration
PEM_KEY="C:\\Users\\Public\\pem.pem"
SSH_USER="ubuntu"
SSH_HOST="54.169.102.51"
DB_USER="inventory_user"
DB_PASSWORD="StrongPass@123"
DB_NAME="inventory_db"
LOCAL_DUMP_FILE="database_dump_$(date +%Y%m%d_%H%M%S).sql"
ANALYSIS_FILE="database_analysis_$(date +%Y%m%d_%H%M%S).txt"

echo ""
echo "Step 1: Downloading database dump from server..."
echo "SSH: $SSH_USER@$SSH_HOST"
echo "Database: $DB_NAME"
echo ""

# Create SSH command to dump database
ssh -i "$PEM_KEY" "$SSH_USER@$SSH_HOST" \
    "mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME" > "$LOCAL_DUMP_FILE"

echo "✅ Database dump downloaded: $LOCAL_DUMP_FILE"
echo ""

echo "Step 2: Analyzing database structure..."
echo ""

# Extract table information
{
    echo "=========================================="
    echo "DATABASE STRUCTURE ANALYSIS"
    echo "Generated: $(date)"
    echo "=========================================="
    echo ""
    
    echo "TABLES IN DATABASE:"
    echo "===================="
    grep "^CREATE TABLE" "$LOCAL_DUMP_FILE" | sed 's/CREATE TABLE `//' | sed 's/` .*//' | sort
    echo ""
    
    echo "TABLE DETAILS:"
    echo "=============="
    
    # Extract each CREATE TABLE statement
    awk '/^CREATE TABLE/,/^;$/' "$LOCAL_DUMP_FILE" | head -500
    
    echo ""
    echo "INDEXES:"
    echo "========"
    grep "KEY\|INDEX" "$LOCAL_DUMP_FILE" | head -50
    
    echo ""
    echo "FOREIGN KEYS:"
    echo "============="
    grep "FOREIGN KEY" "$LOCAL_DUMP_FILE"
    
    echo ""
    echo "SAMPLE DATA COUNTS:"
    echo "==================="
    grep "INSERT INTO" "$LOCAL_DUMP_FILE" | cut -d' ' -f3 | sort | uniq -c | sort -rn
    
} > "$ANALYSIS_FILE"

echo "✅ Analysis saved to: $ANALYSIS_FILE"
echo ""

# Display analysis
echo "=========================================="
echo "ANALYSIS RESULTS:"
echo "=========================================="
cat "$ANALYSIS_FILE"

echo ""
echo "=========================================="
echo "FILES CREATED:"
echo "=========================================="
echo "1. Database Dump: $LOCAL_DUMP_FILE"
echo "2. Analysis Report: $ANALYSIS_FILE"
echo ""
echo "Next steps:"
echo "1. Review the analysis report"
echo "2. Check if tables exist: inventory_transfers, transfer_items, timeline_events"
echo "3. Run migration if needed: mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < migrations/self_transfer_timeline.sql"
echo "=========================================="
