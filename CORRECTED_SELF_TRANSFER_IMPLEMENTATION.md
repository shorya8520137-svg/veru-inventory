# CORRECTED SELF-TRANSFER IMPLEMENTATION

## Key Understanding: Internal Operations vs Customer Transactions

### ❌ Previous Wrong Approach
- Treated self-transfers as customer transactions
- Used invalid `bill_type = 'TRANSFER'` (not in ENUM)
- Mixed internal operations with customer billing

### ✅ Corrected Approach
- **Self-transfers are INTERNAL COMPANY OPERATIONS**
- Use `bill_type = 'B2B'` for internal documentation
- Clear separation from customer transactions
- Proper company operation naming

## Implementation Logic

### W to W (Warehouse to Warehouse)
```
✅ CREATE: self_transfer record
✅ CREATE: self_transfer_items records
❌ NO: Bills entry (pure warehouse operation)
❌ NO: Store inventory updates
❌ NO: Store timeline entries
```

### W to S, S to W, S to S (Store-Based Transfers)
```
✅ CREATE: self_transfer record
✅ CREATE: self_transfer_items records
✅ CREATE: Bills entry (internal B2B operation documentation)
✅ UPDATE/CREATE: Store inventory with proper product details
✅ CREATE: Store timeline entries (inventory_ledger_base)
```

## Billing Documentation Structure

### Internal Operation Bills Entry
```javascript
{
    invoice_number: 'TRF_1234567890',
    bill_type: 'B2B',  // Valid ENUM value for internal operations
    customer_name: 'Internal W to S: Bangalore Warehouse → Main Store Delhi',
    customer_phone: 'INTERNAL-OP',  // Clear internal operation marker
    subtotal: 0.00,  // No monetary value
    grand_total: 0.00,
    payment_mode: 'internal_transfer',
    payment_status: 'completed',
    items: [
        {
            product_name: 'Baby Cloth Set (7 piece set)',
            barcode: '2005-999',
            quantity: 5,
            unit_price: 0.00,
            total: 0.00,
            operation_details: {
                type: 'W to S',
                source: 'BLR_WH',
                destination: 'STORE_001',
                reference: 'TRF_1234567890',
                timestamp: '2026-01-31T12:00:00.000Z'
            }
        }
    ],
    total_items: 1
}
```

## Location Display Names

### Warehouse Mapping
```javascript
const locationMap = {
    'BLR_WH': 'Bangalore Warehouse',
    'GGM_WH': 'Gurgaon Warehouse', 
    'DEL_WH': 'Delhi Warehouse',
    'MUM_WH': 'Mumbai Warehouse'
};
```

### Store Mapping
```javascript
const storeMap = {
    'STORE_001': 'Main Store Delhi',
    'STORE_002': 'Store Mumbai',
    'STORE_003': 'Store Bangalore'
};
```

## Database Transaction Safety

### Transaction Wrapper
```javascript
db.beginTransaction((err) => {
    // All operations wrapped in transaction
    // Rollback on any error
    // Commit only when all operations succeed
});
```

### Error Handling
```javascript
if (error) {
    return db.rollback(() => {
        res.status(500).json({
            success: false,
            message: 'Operation failed, changes rolled back'
        });
    });
}
```

## Store Inventory Management

### Existing Product (Update Stock Only)
```sql
UPDATE store_inventory 
SET stock = stock + ?, 
    last_updated = NOW()
WHERE barcode = ?
```

### New Product (Create Complete Record)
```sql
INSERT INTO store_inventory (
    product_name,     -- From dispatch_product table
    barcode,
    category,         -- From product_categories table  
    stock,
    price,            -- From stock_batches table
    gst_percentage,   -- From stock_batches table
    created_at,
    last_updated
) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
```

## Timeline Documentation

### Store Timeline Entries
```sql
INSERT INTO inventory_ledger_base (
    event_time,
    movement_type,    -- 'SELF_TRANSFER'
    barcode,
    product_name,
    location_code,    -- Store location only
    qty,
    direction,        -- 'IN' or 'OUT'
    reference         -- Transfer reference
) VALUES (NOW(), 'SELF_TRANSFER', ?, ?, ?, ?, ?, ?)
```

## Validation Rules

### Transfer Type Validation
```javascript
const isWarehouseToWarehouse = sourceType === 'warehouse' && destinationType === 'warehouse';
const isStoreBased = destinationType === 'store' || sourceType === 'store';

// Only store-based transfers affect store systems
if (isStoreBased && !isWarehouseToWarehouse) {
    // Process store documentation
}
```

### Location Code Validation
```javascript
const isWarehouse = (location) => location.includes('_WH') || location.startsWith('WH');
const isStore = (location) => location.includes('STORE') || location.startsWith('ST');
```

## Response Structure

### Successful Transfer Response
```javascript
{
    success: true,
    message: 'W to S transfer completed successfully',
    transferId: 'TRF_1234567890',
    transferType: 'W to S',
    affectsStoreSystem: true,
    documentation: {
        transfer_record: true,
        items_recorded: 3,
        store_inventory_updated: true,
        internal_operation_documented: true,
        timeline_created: true
    }
}
```

## Testing Checklist

1. **W to W Transfer**: No store system entries
2. **W to S Transfer**: Store inventory created/updated, internal operation documented
3. **S to W Transfer**: Store inventory reduced, internal operation documented  
4. **S to S Transfer**: Both stores updated, internal operation documented
5. **Product Names**: Show actual names, not "Transferred"
6. **Bills Separation**: Internal operations clearly marked as B2B
7. **Transaction Safety**: Rollback on errors

This implementation ensures proper separation between customer transactions and internal company operations while maintaining comprehensive documentation for store-based transfers.