# DATABASE STRUCTURE ANALYSIS FOR SELF-TRANSFER SYSTEM

## Current Understanding from Codebase

### Key Tables Involved

#### 1. `self_transfer` (Main transfer records)
```sql
- id (primary key)
- transfer_reference (unique identifier like TRF_timestamp)
- transfer_type ('W to W', 'W to S', 'S to W', 'S to S')
- source_location (warehouse/store code)
- destination_location (warehouse/store code)
- order_ref
- awb_number
- logistics
- payment_mode
- executive
- invoice_amount
- remarks
- status ('Completed', 'Pending', etc.)
- created_at
```

#### 2. `self_transfer_items` (Transfer item details)
```sql
- id (primary key)
- transfer_id (foreign key to self_transfer.id)
- product_name
- barcode
- qty (quantity transferred)
```

#### 3. `store_inventory` (Store stock management)
```sql
- id (primary key)
- product_name
- barcode
- category
- stock (current quantity)
- price
- gst_percentage
- created_at
- last_updated
```

#### 4. `bills` (Billing documentation)
```sql
- id (primary key)
- invoice_number
- bill_type
- customer_name
- customer_phone
- subtotal
- grand_total
- payment_mode
- payment_status
- items (JSON)
- total_items
- created_at
```

#### 5. `inventory_ledger_base` (Timeline/movement tracking)
```sql
- id (primary key)
- event_time
- movement_type ('SELF_TRANSFER', 'DISPATCH', etc.)
- barcode
- product_name
- location_code (warehouse/store identifier)
- qty (quantity)
- direction ('IN', 'OUT')
- reference (transfer reference)
```

## CRITICAL ISSUES TO PREVENT

### 1. W to W Transfer Isolation
**PROBLEM**: W to W transfers should NOT create entries in:
- `store_inventory` table
- `bills` table (store billing)
- `inventory_ledger_base` with store location codes

**SOLUTION**: Only store-based transfers (W to S, S to W, S to S) should affect store systems.

### 2. Location Code Standards
**WAREHOUSE CODES**: Should start with 'WH' or 'WAREHOUSE'
**STORE CODES**: Should start with 'ST' or 'STORE' or be store names

### 3. Product Name Issues
**PROBLEM**: Products showing "Transferred" instead of actual names
**SOLUTION**: Get actual product names from `dispatch_product` table

## IMPLEMENTATION LOGIC

### W to W (Warehouse to Warehouse)
```
✅ CREATE: self_transfer record
✅ CREATE: self_transfer_items records
❌ NO: store_inventory updates
❌ NO: bills entries
❌ NO: inventory_ledger_base entries with store locations
```

### W to S (Warehouse to Store)
```
✅ CREATE: self_transfer record
✅ CREATE: self_transfer_items records
✅ UPDATE/CREATE: store_inventory (destination store)
✅ CREATE: bills entry (documentation)
✅ CREATE: inventory_ledger_base entry (IN for destination store)
```

### S to W (Store to Warehouse)
```
✅ CREATE: self_transfer record
✅ CREATE: self_transfer_items records
✅ UPDATE: store_inventory (reduce from source store)
✅ CREATE: bills entry (documentation)
✅ CREATE: inventory_ledger_base entry (OUT for source store)
```

### S to S (Store to Store)
```
✅ CREATE: self_transfer record
✅ CREATE: self_transfer_items records
✅ UPDATE: store_inventory (reduce from source, add to destination)
✅ CREATE: bills entry (documentation)
✅ CREATE: inventory_ledger_base entries (OUT for source, IN for destination)
```

## VALIDATION CHECKS NEEDED

1. **Before Implementation**: Check if W to W transfers already exist in store systems
2. **Location Code Validation**: Ensure proper warehouse vs store identification
3. **Product Name Validation**: Verify dispatch_product table has correct names
4. **Existing Data Cleanup**: Fix any "Transferred" product names

## RECOMMENDED IMPLEMENTATION STEPS

1. **Run Analysis**: Execute `analyze-key-tables.sql` on server
2. **Identify Issues**: Check for W to W in store systems
3. **Clean Existing Data**: Fix product names and remove incorrect entries
4. **Implement Logic**: Add proper store-based transfer documentation
5. **Test Each Type**: Verify W to W isolation and store-based documentation

## SAFETY MEASURES

1. **Transaction Wrapping**: Wrap all operations in database transactions
2. **Rollback Capability**: Ability to undo changes if issues occur
3. **Logging**: Comprehensive logging of all operations
4. **Validation**: Check transfer type before creating store entries