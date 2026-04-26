# 🔧 Complete Database Fix Guide

## Quick Fix (Copy & Paste)

```bash
ssh root@139.59.77.136
mysql -u root -p giftgala_inventory
```

Then paste this:

```sql
-- Fix payment_mode ENUM
ALTER TABLE bills 
MODIFY COLUMN payment_mode ENUM('cash', 'upi', 'card', 'bank', 'internal_transfer') 
NOT NULL DEFAULT 'cash';

-- Fix payment_status ENUM
ALTER TABLE bills 
MODIFY COLUMN payment_status ENUM('paid', 'partial', 'unpaid', 'completed') 
NOT NULL DEFAULT 'paid';

-- Add store_code column
ALTER TABLE store_inventory 
ADD COLUMN store_code VARCHAR(50) NULL AFTER id;

-- Set default store for existing records (CHANGE 'MAIN_STORE' to your actual store code!)
UPDATE store_inventory 
SET store_code = 'MAIN_STORE' 
WHERE store_code IS NULL;

-- Make store_code required
ALTER TABLE store_inventory 
MODIFY COLUMN store_code VARCHAR(50) NOT NULL;

-- Add indexes
ALTER TABLE store_inventory 
ADD INDEX idx_store_code (store_code);

ALTER TABLE store_inventory 
ADD INDEX idx_store_product (store_code, barcode);
```

## ⚠️ IMPORTANT: Update Default Store Code

Before running, replace `'MAIN_STORE'` with your actual default store code. Common options:
- `'GGM_NH48'` - NH48 Store
- `'GGM_ROSHANPURA'` - Roshanpura Store  
- `'GGM_MAIN'` - Main Store
- Or check your stores table: `SELECT store_code, store_name FROM stores;`

## Verification

After running, verify with:

```sql
-- Check payment_mode
SHOW COLUMNS FROM bills LIKE 'payment_mode';
-- Should show: enum('cash','upi','card','bank','internal_transfer')

-- Check payment_status
SHOW COLUMNS FROM bills LIKE 'payment_status';
-- Should show: enum('paid','partial','unpaid','completed')

-- Check store_code
SHOW COLUMNS FROM store_inventory LIKE 'store_code';
-- Should show: varchar(50) NOT NULL

-- Check indexes
SHOW INDEX FROM store_inventory;
-- Should show: idx_store_code, idx_store_product

-- Check store distribution
SELECT store_code, COUNT(*) as products FROM store_inventory GROUP BY store_code;
```

## What This Fixes

✅ **Store-to-store transfers** - payment_mode and payment_status ENUMs
✅ **Warehouse-to-store transfers** - payment_mode and payment_status ENUMs  
✅ **Store inventory filtering** - store_code column
✅ **Store timeline queries** - store_code column
✅ **Multi-store support** - proper store separation

## Files Created

1. `migrations/add_store_code_to_store_inventory.sql` - Store code migration
2. `FIX_ALL_DATABASE_ISSUES.sql` - Complete fix script
3. `DATABASE_FIX_GUIDE.md` - This guide

## Alternative: Use Complete Fix Script

```bash
ssh root@139.59.77.136
cd /tmp
# Upload the file first, then:
mysql -u root -p giftgala_inventory < FIX_ALL_DATABASE_ISSUES.sql
```

## After Fix

1. Restart the Node.js server: `pm2 restart all`
2. Test store-to-store transfer
3. Test warehouse-to-store transfer
4. Check store inventory page
5. Click timeline icon on products

All should work without errors!

---

**Time to Fix**: ⏱️ 3 minutes  
**Risk**: 🟢 LOW - Safe schema changes  
**Impact**: 🎯 HIGH - Fixes all transfer and inventory issues
