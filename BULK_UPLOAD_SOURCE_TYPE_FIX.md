# Bulk Upload source_type Error Fix

## Problem
When submitting bulk upload CSV, getting error:
```
Data truncated for column 'source_type' at row 1
```

## Root Cause
The `stock_batches` table is missing the `source_type` column or has incorrect column definition. The bulk upload controller tries to insert values `'OPENING'` or `'BULK_UPLOAD'` into this column.

## How source_type Works
- **OPENING**: First time a product is added to a warehouse (opening stock)
- **BULK_UPLOAD**: Subsequent additions of the same product to the same warehouse

The controller checks if a product already exists in a warehouse:
```javascript
const existingBatchCheck = await new Promise((resolve, reject) => {
    const checkSql = `SELECT COUNT(*) as count FROM stock_batches 
                     WHERE barcode = ? AND warehouse = ?`;
    db.query(checkSql, [barcode, warehouse], (err, result) => {
        err ? reject(err) : resolve(result[0].count > 0);
    });
});

const sourceType = existingBatchCheck ? 'BULK_UPLOAD' : 'OPENING';
```

## Solution

### Step 1: Fix Database Schema on Server

**Option A: Using Shell Script (Recommended)**
```bash
cd ~/inventoryfullstack
chmod +x fix-bulk-upload-source-type.sh
./fix-bulk-upload-source-type.sh
```

**Option B: Manual SQL Execution**
```bash
cd ~/inventoryfullstack
sudo mysql -u root inventory_db < fix-bulk-upload-source-type.sql
```

**Option C: Direct MySQL Commands**
```bash
sudo mysql -u root inventory_db
```

Then run:
```sql
-- Drop column if exists with wrong type
ALTER TABLE stock_batches DROP COLUMN IF EXISTS source_type;

-- Add column with correct type
ALTER TABLE stock_batches ADD COLUMN source_type VARCHAR(50) DEFAULT NULL AFTER warehouse;

-- Update existing records
UPDATE stock_batches SET source_type = 'OPENING' WHERE source_type IS NULL;

-- Verify
DESCRIBE stock_batches;
```

### Step 2: Restart Server
```bash
pm2 restart all
```

### Step 3: Test Bulk Upload
1. Go to: https://inventoryfullstack-one.vercel.app/inventory/bulk-upload
2. Upload a CSV file with columns: barcode, product_name, variant, warehouse, qty, unit_cost
3. Submit and verify no errors

## Files Involved

### Backend Controller
- **File**: `inventoryfullstack/controllers/bulkUploadController.js`
- **Lines**: 70-100 (source_type logic)
- **Function**: `bulkUploadWithProgress()`

### Database Schema
- **Table**: `stock_batches`
- **Column**: `source_type VARCHAR(50)`
- **Values**: 'OPENING' or 'BULK_UPLOAD'

### Fix Files
- `fix-bulk-upload-source-type.sql` - SQL commands
- `fix-bulk-upload-source-type.sh` - Linux/Mac script
- `fix-bulk-upload-source-type.cmd` - Windows script

## Verification

After applying the fix, verify the column exists:
```sql
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'stock_batches' 
AND COLUMN_NAME = 'source_type';
```

Expected output:
```
COLUMN_NAME  | DATA_TYPE | CHARACTER_MAXIMUM_LENGTH | IS_NULLABLE
source_type  | varchar   | 50                       | YES
```

## Testing

Test with sample CSV:
```csv
barcode,product_name,variant,warehouse,qty,unit_cost
TEST001,Test Product 1,Red,WH001,100,10.50
TEST002,Test Product 2,Blue,WH001,50,15.00
TEST001,Test Product 1,Red,WH002,75,10.50
```

Expected behavior:
- Row 1: source_type = 'OPENING' (first time TEST001 in WH001)
- Row 2: source_type = 'OPENING' (first time TEST002 in WH001)
- Row 3: source_type = 'OPENING' (first time TEST001 in WH002)

If you upload the same CSV again:
- All rows: source_type = 'BULK_UPLOAD' (products already exist in warehouses)

## Troubleshooting

### Error: Column doesn't exist
```
Unknown column 'source_type' in 'field list'
```
**Solution**: Run the SQL fix script

### Error: Data truncated
```
Data truncated for column 'source_type' at row 1
```
**Solution**: Column exists but has wrong type (maybe ENUM). Run SQL fix to recreate it.

### Error: Access denied
```
Access denied for user 'root'@'localhost'
```
**Solution**: Use `sudo mysql` or check database credentials

## Related Documentation
- Main features: `FEATURES_DOCUMENTATION.md`
- Server deployment: `SERVER_DEPLOYMENT_GUIDE.md`
- Changes summary: `FINAL_CHANGES_SUMMARY.md`
