# INVENTORY CLEANUP INSTRUCTIONS

## ⚠️ IMPORTANT: Follow these steps in order!

### STEP 1: Download and Analyze Database

Run this script to download the database and analyze its structure:

```powershell
.\step1-download-and-analyze.ps1
```

This will create 3 files:
1. **inventory_backup.sql** - Full database backup (KEEP THIS SAFE!)
2. **all_tables.txt** - List of all tables in the database
3. **database_analysis_report.txt** - Detailed structure and row counts

### STEP 2: Review the Analysis

Open `database_analysis_report.txt` and look for:
- Tables related to inventory (inventory, stock, etc.)
- Tables related to timeline
- Tables related to self-transfer
- Any other tables that store inventory data

**Look for these patterns in table names:**
- `inventory`
- `timeline`
- `transfer`
- `stock`
- `batch`
- `warehouse`
- `store`

### STEP 3: Create the SQL Script

Based on the analysis, we'll create the correct SQL script to empty only the tables that need to be emptied.

**DO NOT guess table names!**

### STEP 4: Execute the SQL

Only after reviewing the analysis and creating the correct SQL script, we'll execute it on the server.

---

## Files in this directory:

- `step1-download-and-analyze.ps1` - Download and analyze database
- `empty-inventory-system.sql` - Will be created after analysis
- `inventory_backup.sql` - Database backup (created by step 1)
- `database_analysis_report.txt` - Analysis report (created by step 1)

---

## Server Details:

- **Server IP:** 13.212.82.15
- **SSH User:** ubuntu
- **SSH Key:** C:\Users\singh\.ssh\pem.pem
- **Database:** inventory_db

---

## Safety Notes:

✅ Always backup before making changes
✅ Review analysis before creating SQL
✅ Test SQL on backup first if possible
❌ Never run TRUNCATE/DELETE without knowing the structure
❌ Never assume table names exist
