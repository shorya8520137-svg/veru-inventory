# INVENTORY SYSTEM - COMPLETE ANALYSIS & FIXES
**Date:** April 24, 2026  
**Status:** Critical Issues Identified - Comprehensive Fix Plan

---

## EXECUTIVE SUMMARY

The inventory system has 4 critical issues causing user frustration:

1. **Timeline not scrollable** - CSS container height issue
2. **Self-transfer count showing zero** - Wrong API endpoint being called
3. **Product names showing "Transferred"** - Hardcoded category instead of actual product name
4. **Timeline showing reference codes** - Missing product name in ledger entries

**ROOT CAUSE:** Piecemeal fixes without understanding complete data flow. System has architectural splits between `inventory` vs `stock_batches`, disconnected frontend API calls, and incomplete data validation.

---

## CURRENT SYSTEM ARCHITECTURE

### Database Tables (Key Relationships)
```
inventory_ledger_base (AUDIT LOG - Source of Truth)
├── barcode, product_name, movement_type, direction, qty
├── reference (SELF_TRANSFER_STF-001_1234567890)
└── Used by: Timeline API

stock_batches (FIFO INVENTORY)
├── barcode, warehouse, qty_available, status
└── Updated by: Self-transfer, Dispatch

self_transfer (TRANSFER RECORDS)
├── transfer_reference, source_location, destination_location
└── Links to: self_transfer_items

self_transfer_items (TRANSFER LINE ITEMS)
├── transfer_id, product_name, barcode, qty
└── Created by: Self-transfer controller
```

### Data Flow Issues
```
Frontend (TransferForm) → API (selfTransferRoutes) → Controller → Database
     ↓                         ↓                        ↓           ↓
"Product | Variant | Code"  extractProductName()   Ledger Write  Timeline Query
     ↓                         ↓                        ↓           ↓
Wrong format               Empty product_name      Reference only  Shows codes
```

---

## ISSUE ANALYSIS & FIXES

### ISSUE #1: Timeline Not Scrollable
**Problem:** CSS container doesn't have proper height constraints
**Location:** `src/app/inventory/StoreTimeline.jsx`
**Fix:** Add max-height and ensure parent container has fixed dimensions

### ISSUE #2: Self-Transfer Count Shows Zero
**Problem:** Frontend calls `/api/inventory-ledger` instead of `/api/self-transfer`
**Location:** `src/app/inventory/selftransfer/SelfTransfer.jsx`
**Fix:** Change API endpoint to get actual self-transfer records

### ISSUE #3: Product Names Show "Transferred"
**Problem:** Hardcoded category "Transferred" in store inventory creation
**Location:** `routes/selfTransferRoutes.js` line ~130
**Fix:** Use actual product name and category from products table

### ISSUE #4: Timeline Shows Reference Codes
**Problem:** Product name not properly stored in inventory_ledger_base
**Location:** `controllers/selfTransferController.js`
**Fix:** Validate and ensure product_name is correctly extracted and stored

---

## COMPREHENSIVE FIX IMPLEMENTATION

### Fix 1: Timeline Scrollability
```jsx
// StoreTimeline.jsx - Add proper container heights
<div style={{ 
    height: '100vh', 
    maxHeight: '600px', 
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
}}>
```

### Fix 2: Self-Transfer Count API
```javascript
// SelfTransfer.jsx - Call correct endpoint
const loadSelfTransfers = async () => {
    const res = await fetch(`${API_BASE}/api/self-transfer`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    // Filter and count SELF_TRANSFER entries
};
```

### Fix 3: Product Name Storage
```javascript
// selfTransferController.js - Fix product name extraction
function extractProductName(productString) {
    // "Product Name | Variant | Barcode" → "Product Name"
    const parts = productString.split('|');
    return parts[0]?.trim() || 'Unknown Product';
}

// Store actual product name, not "Transferred"
const createProductSql = `
    INSERT INTO store_inventory (product_name, barcode, category, stock, price)
    VALUES (?, ?, ?, ?, 0.00)
`;
db.query(createProductSql, [actualProductName, barcode, actualCategory, qty]);
```

### Fix 4: Timeline Product Names
```javascript
// Ensure product_name is always stored in ledger
const ledgerSql = `
    INSERT INTO inventory_ledger_base (
        event_time, movement_type, barcode, product_name, location_code,
        qty, direction, reference
    ) VALUES (NOW(), 'SELF_TRANSFER', ?, ?, ?, ?, ?, ?)
`;
db.query(ledgerSql, [barcode, validatedProductName, location, qty, direction, reference]);
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Critical Fixes (Immediate)
1. Fix timeline scrollability (CSS)
2. Fix self-transfer count API endpoint
3. Fix product name display ("Transferred" → actual name)
4. Fix timeline product names (reference codes → names)

### Phase 2: Data Consistency (Next)
1. Sync inventory.stock with stock_batches
2. Add product name validation before ledger write
3. Add transaction rollback on failures
4. Improve error handling

### Phase 3: Architecture Improvements (Future)
1. Unify inventory tables (single source of truth)
2. Add multi-tenant support
3. Implement optimistic locking
4. Add comprehensive audit trails

---

## FILES TO MODIFY

### Frontend Files:
- `src/app/inventory/StoreTimeline.jsx` - Timeline scrolling
- `src/app/inventory/selftransfer/SelfTransfer.jsx` - API endpoint
- `src/app/products/TransferForm.jsx` - Product validation

### Backend Files:
- `controllers/selfTransferController.js` - Product name extraction
- `routes/selfTransferRoutes.js` - Store inventory creation
- `controllers/timelineController.js` - Timeline query optimization

### Database:
- No schema changes needed for Phase 1
- Data cleanup for existing "Transferred" entries

---

## SUCCESS CRITERIA

✅ Timeline scrolls smoothly with 100+ entries  
✅ Self-transfer count shows actual number of transfers  
✅ Product names display correctly (not "Transferred")  
✅ Timeline shows product names (not reference codes)  
✅ All existing functionality preserved  
✅ No data loss during fixes  

---

## TESTING PLAN

1. **Create test self-transfer** with known product
2. **Verify timeline scrolling** with multiple entries
3. **Check self-transfer count** updates correctly
4. **Confirm product names** display properly
5. **Validate timeline entries** show names not codes

---

**Next Step:** Implement Phase 1 fixes in order of priority