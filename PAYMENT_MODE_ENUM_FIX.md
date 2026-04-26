# Payment Mode & Status ENUM Fix for Store-to-Store Transfers

## Problem

Store-to-store transfers were failing with these errors:
```
Error: Data truncated for column 'payment_mode' at row 1
Error: Data truncated for column 'payment_status' at row 1
```

### Root Cause
The `bills` table has two ENUM columns with limited values:

1. **payment_mode** ENUM with only:
   - `'cash'`, `'upi'`, `'card'`, `'bank'`

2. **payment_status** ENUM with only:
   - `'paid'`, `'partial'`, `'unpaid'`

When creating internal transfer billing entries, the code was trying to insert:
- `payment_mode: 'internal_transfer'` ❌ Not in ENUM
- `payment_status: 'completed'` ❌ Not in ENUM

### Error Location
File: `services/BillingIntegrationService.js`
Lines: ~90 and ~360

```javascript
// These were failing:
payment_mode: 'internal_transfer',  // ❌ Not in ENUM
payment_status: 'completed'         // ❌ Not in ENUM
```

## Solution

Add missing values to both ENUMs:
- Add `'internal_transfer'` to `payment_mode`
- Add `'completed'` to `payment_status`

### Migration SQL

```sql
-- Fix payment_mode ENUM
ALTER TABLE bills 
MODIFY COLUMN payment_mode ENUM('cash', 'upi', 'card', 'bank', 'internal_transfer') 
NOT NULL DEFAULT 'cash';

-- Fix payment_status ENUM
ALTER TABLE bills 
MODIFY COLUMN payment_status ENUM('paid', 'partial', 'unpaid', 'completed') 
NOT NULL DEFAULT 'paid';
```

## How to Apply the Fix

### Option 1: Using PowerShell Script (Recommended)
```powershell
cd veru-inventory-main
./fix-payment-mode-enum.ps1
```

### Option 2: Manual SSH Execution
```bash
# SSH into server
ssh root@139.59.77.136

# Run migration
mysql -u root -p giftgala_inventory < /path/to/add_internal_transfer_payment_mode.sql

# Verify
mysql -u root -p giftgala_inventory -e "SHOW COLUMNS FROM bills LIKE 'payment_mode';"
mysql -u root -p giftgala_inventory -e "SHOW COLUMNS FROM bills LIKE 'payment_status';"
```

### Option 3: Direct MySQL Command (FASTEST)
```bash
ssh root@139.59.77.136
mysql -u root -p giftgala_inventory
```

Then paste these commands:
```sql
-- Fix payment_mode
ALTER TABLE bills 
MODIFY COLUMN payment_mode ENUM('cash', 'upi', 'card', 'bank', 'internal_transfer') 
NOT NULL DEFAULT 'cash';

-- Fix payment_status
ALTER TABLE bills 
MODIFY COLUMN payment_status ENUM('paid', 'partial', 'unpaid', 'completed') 
NOT NULL DEFAULT 'paid';

-- Verify both columns
SHOW COLUMNS FROM bills LIKE 'payment_mode';
SHOW COLUMNS FROM bills LIKE 'payment_status';
```

## Verification

After applying the fix, you should see:

**payment_mode:**
```
Type: enum('cash','upi','card','bank','internal_transfer')
```

**payment_status:**
```
Type: enum('paid','partial','unpaid','completed')
```

## Testing

After the migration, test transfers:

### Store-to-Store Transfer:
1. Go to Products page
2. Select a product
3. Click "Transfer" button
4. Choose source and destination stores
5. Enter quantity
6. Submit transfer

### Warehouse-to-Store Transfer:
1. Go to Products page
2. Select a product
3. Click "Transfer" button
4. Choose source warehouse and destination store
5. Enter quantity
6. Submit transfer

**Expected Result**: Both transfers succeed without "Data truncated" errors

## Impact

- **Before Fix**: All transfers fail with database errors
- **After Fix**: All transfers work correctly
- **Backward Compatible**: Yes - existing values still work
- **Data Loss**: None - non-destructive schema changes

## Files Modified

1. `migrations/add_internal_transfer_payment_mode.sql` - Migration script (updated)
2. `fix-payment-mode-enum.ps1` - PowerShell deployment script
3. `PAYMENT_MODE_ENUM_FIX.md` - This documentation (updated)

## Related Files (No Changes Needed)

- `services/BillingIntegrationService.js` - Already using correct values
- `routes/selfTransferRoutes.NEW.js` - Uses BillingIntegrationService
- `services/StockReductionService.js` - Stock reduction logic
- `services/TimelineService.js` - Timeline logging

## Why 'completed' for payment_status?

Internal transfers are not traditional payments, so:
- ❌ `'paid'` - Implies money was exchanged
- ❌ `'partial'` - Implies partial payment
- ❌ `'unpaid'` - Implies debt
- ✅ `'completed'` - Indicates the transfer operation finished successfully

---

**Status**: Ready to deploy
**Priority**: 🔴 CRITICAL (blocks ALL transfers)
**Risk**: 🟢 LOW (safe schema changes)
**Time to Fix**: ⏱️ 2 minutes
**Rollback**: Can remove new ENUM values if needed (only if no records use them)
