# Store Timeline Fix - Updated to Use New API

## Problem
The `StoreTimeline.jsx` component was using the **old warehouse timeline API** (`/api/timeline?warehouse=...`) which doesn't have proper store-specific data. This API was designed for warehouses, not stores.

## Solution
Updated `StoreTimeline.jsx` to use the **new store timeline API** (`/api/store-timeline/:storeCode`) that we just created, which provides:
- ✅ Actual store movements from `store_timeline` table
- ✅ Product details (name, barcode)
- ✅ Movement type (SELF_TRANSFER, OPENING, DISPATCH, RETURN, DAMAGE, RECOVER, MANUAL)
- ✅ Direction (IN/OUT) with proper color coding
- ✅ Stock before and after each movement
- ✅ User who performed the action
- ✅ Reference numbers for traceability

## Changes Made

### 1. API Endpoint Change
**Before:**
```javascript
const response = await fetch(`${API_BASE}/api/timeline?warehouse=${storeCode}&limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
});
```

**After:**
```javascript
const response = await fetch(`${API_BASE}/api/store-timeline/${storeCode}?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. Data Transformation
**Before:**
- Used summary data (total_in, total_out, net_movement)
- No product details
- No stock before/after
- No movement type details

**After:**
- Uses detailed timeline entries
- Shows product name and barcode
- Calculates stock before/after correctly
- Maps movement types to event types
- Shows direction (IN/OUT) with color coding

### 3. UI Improvements
**Added:**
- Product name display (bold, prominent)
- Product barcode (SKU) display
- Movement type and direction labels
- User who performed the action
- Color-coded quantities (green for IN, red for OUT)
- "Store Transfer" badge for SELF_TRANSFER movements
- "Initial Stock" badge for OPENING movements

## Timeline Data Structure

### API Response Format
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "id": 1,
        "store_code": "GURUGRAM-NH48",
        "product_barcode": "361313801009",
        "product_name": "Beach Resort Wear",
        "movement_type": "SELF_TRANSFER",
        "direction": "OUT",
        "quantity": 5,
        "balance_after": 15,
        "reference": "STF-1234567890",
        "user_id": "user@example.com",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 50
  }
}
```

### Movement Type Mapping
| Database Value | Display Label | Event Type |
|---------------|---------------|------------|
| SELF_TRANSFER (IN) | Stock Received | TRANSFER_IN |
| SELF_TRANSFER (OUT) | Stock Transferred | TRANSFER_OUT |
| OPENING | Initial Stock | INITIAL_STOCK |
| DISPATCH | Stock Transferred | TRANSFER_OUT |
| RETURN | Stock Received | TRANSFER_IN |
| DAMAGE | Damaged | DAMAGED |
| RECOVER | Stock Received | TRANSFER_IN |
| MANUAL (IN) | Stock Received | TRANSFER_IN |
| MANUAL (OUT) | Stock Transferred | TRANSFER_OUT |

## How It Works Now

### 1. Store Selection
User selects a store from the dropdown → Component fetches timeline for that store

### 2. API Call
```javascript
GET /api/store-timeline/GURUGRAM-NH48?limit=100
```

### 3. Data Transformation
```javascript
const transformedTimeline = data.data.timeline.map(item => {
    // Map movement_type to eventType
    const eventType = eventTypeMap[item.movement_type] || 'UNKNOWN';
    
    // Calculate stock before
    const stockBefore = item.direction === 'IN' 
        ? item.balance_after - item.quantity 
        : item.balance_after + item.quantity;
    
    return {
        eventType: eventType,
        timestamp: item.created_at,
        quantity: item.direction === 'IN' ? item.quantity : -item.quantity,
        stockBefore: stockBefore,
        stockAfter: item.balance_after,
        productName: item.product_name,
        productBarcode: item.product_barcode,
        movementType: item.movement_type,
        direction: item.direction,
        userId: item.user_id,
        notes: item.reference ? `Reference: ${item.reference}` : '',
        status: 'COMPLETED'
    };
});
```

### 4. Display
Timeline shows each movement with:
- Product name and barcode
- Movement type and direction
- Quantity (color-coded: green for IN, red for OUT)
- Stock before and after
- Timestamp
- User who performed the action
- Reference number
- Status badges

## Testing

### 1. Check Timeline Display
1. Navigate to Store Timeline page
2. Select a store from dropdown
3. Verify timeline entries appear

### 2. Verify Data
- Product names should be displayed
- Barcodes should be shown
- Quantities should be color-coded (green for IN, red for OUT)
- Stock before/after should be calculated correctly
- Movement types should be labeled correctly

### 3. Test Filters
- Filter by movement type (All Events, Incoming, Outgoing, Initial Stock)
- Verify filtered results are correct

## What Happens After Store-to-Store Transfer

When a store-to-store transfer is completed:

1. **Billing Entry Created** (bills table)
   - `bill_type = 'INTERNAL_TRANSFER'`
   - `invoice_number = 'STF-1234567890'`

2. **Stock Batches Updated** (stock_batches table)
   - Source batches exhausted (FIFO)
   - Destination batches created with parent linkage

3. **Timeline Entries Created** (store_timeline table)
   - Source OUT entry: `direction='OUT', quantity=5, balance_after=15`
   - Destination IN entry: `direction='IN', quantity=5, balance_after=5`

4. **Timeline UI Updates**
   - Source store shows "Stock Transferred" (red, -5 units)
   - Destination store shows "Stock Received" (green, +5 units)
   - Both entries show product details and reference number

## Benefits

### Before (Old API)
- ❌ No product details
- ❌ No stock before/after
- ❌ No movement type details
- ❌ Summary data only (not detailed movements)
- ❌ No user tracking
- ❌ No reference numbers

### After (New API)
- ✅ Product name and barcode displayed
- ✅ Stock before/after calculated correctly
- ✅ Movement type and direction shown
- ✅ Detailed movement entries
- ✅ User who performed action tracked
- ✅ Reference numbers for traceability
- ✅ Color-coded quantities (green/red)
- ✅ Proper badges (Store Transfer, Initial Stock)

## Next Steps

### 1. Deploy Database Migration
```bash
mysql -u username -p database_name < migrations/create_store_timeline_table.sql
```

### 2. Deploy Updated Routes
```bash
.\deploy-store-inventory-fix.ps1
```

### 3. Test Timeline
1. Perform a store-to-store transfer
2. Check source store timeline (should show OUT entry)
3. Check destination store timeline (should show IN entry)
4. Verify product details, quantities, and stock levels

### 4. Monitor
- Check that timeline entries are created for all transfers
- Verify stock before/after calculations are correct
- Ensure reference numbers link to billing entries

## Troubleshooting

### Timeline Shows "No timeline events found"
**Possible Causes:**
1. `store_timeline` table doesn't exist → Run migration
2. No transfers have been made yet → Perform a test transfer
3. API endpoint not registered → Check server.js has `storeTimelineRoutes`

**Solution:**
```bash
# Check if table exists
mysql> SHOW TABLES LIKE 'store_timeline';

# Check if route is registered
grep -r "storeTimelineRoutes" server.js

# Perform test transfer
curl -X POST http://localhost:3000/api/self-transfer \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Timeline Shows Wrong Data
**Possible Causes:**
1. Using old API endpoint
2. Data transformation incorrect
3. Stock calculations wrong

**Solution:**
- Verify API endpoint is `/api/store-timeline/:storeCode`
- Check browser console for API response
- Verify `balance_after` values in database

### Stock Before/After Incorrect
**Possible Causes:**
1. Direction not considered in calculation
2. Balance_after not set correctly in database

**Solution:**
```javascript
// Correct calculation
const stockBefore = item.direction === 'IN' 
    ? item.balance_after - item.quantity  // If IN, before = after - quantity
    : item.balance_after + item.quantity; // If OUT, before = after + quantity
```

## Summary

The store timeline is now **fully functional** and uses the proper API endpoint with detailed movement data. It shows:
- ✅ Product details
- ✅ Movement types
- ✅ Stock before/after
- ✅ User tracking
- ✅ Reference numbers
- ✅ Color-coded quantities
- ✅ Proper badges

**The timeline will work correctly once the database migration is run and the new routes are deployed!** 🎉
