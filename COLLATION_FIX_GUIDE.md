# Collation Mismatch Fix Guide

## Problem
You're getting this error when trying to JOIN `stores` and `store_inventory` tables:
```
ERROR 1267 (HY000): Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT) and (utf8mb4_0900_ai_ci,IMPLICIT) for operation '='
```

## Root Cause
The `store_code` column has different collations in different tables:
- `store_inventory.store_code` → `utf8mb4_unicode_ci`
- `stores.store_code` → `utf8mb4_0900_ai_ci`

## Quick Fix (Recommended)

### Step 1: Fix the collation mismatch
Run this command to standardize `store_inventory.store_code` to match `stores.store_code`:

```sql
ALTER TABLE store_inventory 
MODIFY COLUMN store_code VARCHAR(50) 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_0900_ai_ci 
NULL;
```

### Step 2: Verify the fix
```sql
-- Check collations are now the same
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('store_inventory', 'stores')
  AND COLUMN_NAME = 'store_code';
```

Both should show `utf8mb4_0900_ai_ci`.

### Step 3: Test the JOIN
```sql
SELECT 
    si.store_code,
    s.store_name,
    COUNT(*) as products
FROM store_inventory si
LEFT JOIN stores s ON si.store_code = s.store_code
GROUP BY si.store_code, s.store_name;
```

This should work without errors now.

## Temporary Workaround (If you can't run ALTER TABLE yet)

Use `COLLATE` in your JOIN queries to force the same collation:

```sql
SELECT 
    si.store_code,
    s.store_name,
    s.city,
    COUNT(*) as product_count,
    SUM(si.stock) as total_stock
FROM store_inventory si
LEFT JOIN stores s ON si.store_code COLLATE utf8mb4_0900_ai_ci = s.store_code COLLATE utf8mb4_0900_ai_ci
GROUP BY si.store_code, s.store_name, s.city
ORDER BY si.store_code;
```

## Current Status of Your Data

Based on your updates, you have:
- **Product 1** (barcode: 361313801009) → `GGM_MGF_MALL`
- **Product 2** (barcode: 199627757257) → `GGM_ROSHANPURA`

### Verify current state:
```sql
SELECT 
    id,
    store_code,
    product_name,
    barcode,
    stock,
    price
FROM store_inventory
ORDER BY id;
```

## Files Created for You

1. **fix-collation-mismatch.sql** - Complete collation fix with all options
2. **verify-stores-without-join.sql** - Verification queries that work with or without the fix
3. **update-store-codes-distribution.sql** - Queries to distribute products across stores

## Next Steps

1. ✅ Run the ALTER TABLE command to fix collation
2. ✅ Verify the fix worked
3. ✅ Test your store filtering in the UI
4. ✅ Distribute more products to other stores as needed

## Why This Happened

- `utf8mb4_0900_ai_ci` is the default collation in MySQL 8.0
- `utf8mb4_unicode_ci` is an older collation standard
- When tables are created at different times or with different settings, they can end up with different collations
- MySQL requires matching collations for JOIN operations

## Impact

- **Before fix**: Cannot JOIN stores and store_inventory tables
- **After fix**: All queries work normally
- **No data loss**: This only changes how text is compared, not the data itself
