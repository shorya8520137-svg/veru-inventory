# Store-to-Store Transfer Timeline Fix

## Problem Identified

When performing store-to-store transfers, the system was showing:
```
📋 Timeline entries summary for S to S:
- Source (store): No entry (store)
- Destination (store): No entry (store)
```

This meant that store-to-store transfers were **NOT creating timeline entries** in the `store_timeline` table, making it impossible to track inventory movements between stores.

## Root Cause

The old `selfTransferRoutes.js` file only created timeline entries for **warehouse** transfers, not for **store** transfers. The code explicitly skipped stores:

```javascript
// OLD CODE - WRONG
if (sourceType === 'warehouse') {
    // Create timeline entry
}
if (destinationType === 'warehouse') {
    // Create timeline entry
}
// Stores were completely ignored!
```

## Solution Implemented

### 1. Replaced selfTransferRoutes.js

**Backed up old file:**
- `routes/selfTransferRoutes.js` → `routes/selfTransferRoutes.OLD.js`

**Activated new file:**
- `routes/selfTransferRoutes.NEW.js` → `routes/selfTransferRoutes.js`

### 2. New Implementation Uses BillingIntegrationService

The new implementation properly handles store-to-store transfers:

```javascript
// NEW CODE - CORRECT
if (isStoreToStore) {
    // Use BillingIntegrationService
    const result = await BillingIntegrationService.createTransferWithBilling({
        sourceStoreCode: sourceId,
        destinationStoreCode: destinationId,
        productBarcode: barcode,
        productName: productName,
        quantity: item.transferQty,
        userId: req.user?.email || 'system',
        transferReference: `${transferRef}-${barcode}`
    });
}
```

### 3. What BillingIntegrationService Does

The service performs a complete transaction:

1. **Validates stock** - Ensures source store has enough stock
2. **Creates billing entry** - Records the transfer as an internal billing operation
3. **Reduces source stock** - Updates `stock_batches` for source store
4. **Increases destination stock** - Updates `stock_batches` for destination store
5. **Creates timeline entries** - Logs BOTH source OUT and destination IN entries in `store_timeline`

```javascript
// Timeline entries created by TimelineService
await TimelineService.logTransferMovements({
    sourceStoreCode,
    destinationStoreCode,
    productBarcode,
    productName,
    quantity,
    transferReference,
    userId,
    sourceBalanceAfter,
    destinationBalanceAfter
}, connection);
```

## What This Fixes

### Before Fix:
- ❌ Store-to-store transfers had no timeline entries
- ❌ Could not track inventory movements between stores
- ❌ Store inventory timeline showed no data
- ❌ No audit trail for store transfers

### After Fix:
- ✅ Store-to-store transfers create proper timeline entries
- ✅ Both source OUT and destination IN entries are logged
- ✅ Timeline shows complete movement history
- ✅ Full audit trail with balance tracking
- ✅ Billing integration for internal documentation

## Database Tables Affected

### store_timeline
Timeline entries are now created with:
- `store_code` - Store identifier
- `product_barcode` - Product being transferred
- `movement_type` - 'SELF_TRANSFER'
- `direction` - 'OUT' for source, 'IN' for destination
- `quantity` - Amount transferred
- `balance_after` - Stock balance after transfer
- `reference` - Transfer reference number
- `created_at` - Timestamp

### bills
Internal billing entries are created with:
- `bill_type` - 'INTERNAL_TRANSFER'
- `payment_mode` - 'internal_transfer'
- `payment_status` - 'completed'
- `items` - JSON array with transfer details

### stock_batches
Stock is properly updated:
- Source store: `qty_available` reduced
- Destination store: `qty_available` increased

## Testing

### Test a Store-to-Store Transfer:

1. Go to Products → Transfer Form
2. Select:
   - Source Type: Store
   - Source: GGM_MGF_MALL
   - Destination Type: Store
   - Destination: GGM_ROSHANPURA
   - Product: Any product
   - Quantity: 1

3. Submit the transfer

4. Check the console logs - you should see:
```
🔄 Starting billing-triggered transfer: GGM_MGF_MALL → GGM_ROSHANPURA
✅ Billing entry created: STF-1777190695244-361313801009 (ID: 123)
✅ Stock transfer completed: 1 units reduced from source, 1 units added to destination
✅ Timeline entries created: Source OUT (ID: 456), Destination IN (ID: 457)
✅ Transaction committed successfully
```

### Verify Timeline Entries:

```sql
-- Check timeline entries for a store
SELECT 
    id,
    store_code,
    product_barcode,
    product_name,
    movement_type,
    direction,
    quantity,
    balance_after,
    reference,
    created_at
FROM store_timeline
WHERE store_code IN ('GGM_MGF_MALL', 'GGM_ROSHANPURA')
ORDER BY created_at DESC
LIMIT 10;
```

### Verify Billing Entries:

```sql
-- Check internal transfer billing entries
SELECT 
    id,
    invoice_number,
    bill_type,
    customer_name,
    payment_mode,
    payment_status,
    items,
    created_at
FROM bills
WHERE bill_type = 'INTERNAL_TRANSFER'
ORDER BY created_at DESC
LIMIT 10;
```

## Next Steps

1. ✅ **Restart the server** to load the new routes
2. ✅ **Test store-to-store transfers** to verify timeline entries are created
3. ✅ **Check the Store Inventory Timeline** in the UI
4. ✅ **Verify stock balances** are correct after transfers

## Files Modified

- `routes/selfTransferRoutes.js` - Replaced with new version
- `routes/selfTransferRoutes.OLD.js` - Backup of old version (for reference)

## Files Already Existing (No Changes Needed)

- `services/BillingIntegrationService.js` - Already implements proper store transfers
- `services/TimelineService.js` - Already implements timeline logging
- `routes/storeTimelineRoutes.js` - Already implements timeline API
- `src/app/billing/StoreInventoryTab.jsx` - Already has Timeline button

## Important Notes

1. **Database ENUM Fix Still Needed**: You still need to run the collation fix and ENUM fixes:
   ```sql
   -- Fix collation
   ALTER TABLE store_inventory 
   MODIFY COLUMN store_code VARCHAR(50) 
   CHARACTER SET utf8mb4 
   COLLATE utf8mb4_0900_ai_ci 
   NULL;
   
   -- Fix payment_mode ENUM
   ALTER TABLE bills 
   MODIFY COLUMN payment_mode ENUM('cash', 'upi', 'card', 'bank', 'internal_transfer') 
   NOT NULL DEFAULT 'cash';
   
   -- Fix payment_status ENUM
   ALTER TABLE bills 
   MODIFY COLUMN payment_status ENUM('paid', 'partial', 'unpaid', 'completed') 
   NOT NULL DEFAULT 'paid';
   ```

2. **Server Restart Required**: The new routes won't take effect until you restart the Node.js server

3. **Existing Transfers**: Old transfers won't have timeline entries. Only new transfers after this fix will be tracked.

## Architecture Benefits

This implementation follows the **Billing-Triggers-Stock** architecture:
- Store transfers are treated as internal billing operations
- Stock reduction happens synchronously with billing
- Complete audit trail through timeline entries
- Transaction safety ensures data consistency
- No orphaned records or partial updates
