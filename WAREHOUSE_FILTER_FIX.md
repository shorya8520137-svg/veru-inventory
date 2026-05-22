# Warehouse Filter Issue - Diagnosis & Fix

## 🐛 Problem
The warehouse filter in Inventory tab shows wrong warehouses:
- ❌ Showing: Gurgaon, Bangalore, Mumbai, Ahmedabad, Hyderabad
- ✅ Should show: gandu nagar (test-01), shail ke gand (test-98), etc.

## 🔍 Root Cause
1. **PermissionsContext.jsx** has hardcoded `WAREHOUSES` constant with fake data
2. API call to `/warehouse-management/warehouses` is failing or returning empty
3. System falls back to hardcoded `WAREHOUSES` constant

## 📋 Files Involved
1. `src/contexts/PermissionsContext.jsx` - Lines 105-111 (hardcoded WAREHOUSES)
2. `src/services/permissionsApi.js` - Line 248 (getWarehouses API call)
3. `routes/warehouseManagementRoutes.js` - Backend API endpoint

## 🔧 Fix Steps

### Step 1: Check if API endpoint exists and works
```bash
# Test the warehouse API
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.giftgala.in/api/warehouse-management/warehouses
```

### Step 2: If API works, remove hardcoded fallback
In `src/contexts/PermissionsContext.jsx` line 320:
```javascript
// BEFORE (wrong):
setWarehouses(WAREHOUSES); // Falls back to fake data

// AFTER (correct):
setWarehouses({}); // Don't fallback to fake data
console.error('Failed to load warehouses:', error);
```

### Step 3: Update hardcoded WAREHOUSES to match real data
In `src/contexts/PermissionsContext.jsx` lines 105-111:
```javascript
// BEFORE (fake data):
export const WAREHOUSES = {
    GGM_WH: { code: 'GGM_WH', name: 'Gurgaon Warehouse', location: 'Gurgaon, Haryana' },
    BLR_WH: { code: 'BLR_WH', name: 'Bangalore Warehouse', location: 'Bangalore, Karnataka' },
    // ... more fake warehouses
};

// AFTER (real data from database):
export const WAREHOUSES = {
    'test-01': { code: 'test-01', name: 'gandu nagar', location: 'gandupui, gandunagr' },
    'test-98': { code: 'test-98', name: 'shail ke gand', location: 'yamunagar, ganduzilla' },
    // Add other real warehouses from database
};
```

### Step 4: Verify warehouse API endpoint
Check `routes/warehouseManagementRoutes.js` has correct query:
```javascript
// Should query from dispatch_warehouse or warehouses table
router.get('/warehouses', async (req, res) => {
    const query = `
        SELECT 
            warehouse_code,
            Warehouse_name as warehouse_name,
            address,
            // ... other fields
        FROM dispatch_warehouse
        WHERE 1=1
    `;
    // Execute and return
});
```

## 🎯 Quick Fix (Temporary)
Update the hardcoded WAREHOUSES constant with real data from your database.

## ✅ Proper Fix (Permanent)
1. Ensure `/api/warehouse-management/warehouses` endpoint works
2. Returns data in correct format:
```json
{
    "success": true,
    "warehouses": [
        {
            "warehouse_code": "test-01",
            "warehouse_name": "gandu nagar",
            "city": "gandupui",
            "state": "gandunagr"
        }
    ]
}
```
3. Remove hardcoded fallback

## 📊 Expected Result
After fix, warehouse filter should show:
- ✅ gandu nagar (test-01)
- ✅ shail ke gand (test-98)
- ✅ All other real warehouses from database

## 🧪 Test
1. Open Inventory tab
2. Click "All Warehouses" filter
3. Should see real warehouse names from database
4. Select a warehouse
5. Should filter inventory correctly
