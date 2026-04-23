# Dropdown Selection Logic - Complete Testing Summary

## Quick Start

### 1. Start Backend Server (Terminal 1)
```bash
cd veru-inventory-main
npm run server
```

### 2. Start Frontend Dev Server (Terminal 2)
```bash
cd veru-inventory-main
npm run dev
```

### 3. Verify Database Data (Terminal 3)
```bash
cd veru-inventory-main
node verify-dropdown-data.js
```

Expected output:
```
📦 WAREHOUSES
   Active Count: 8
   Sample Data:
      1. Gurgaon Main Warehouse (GGM_WH) - Gurgaon - ID: 1
      2. Bangalore Warehouse (BLR_WH) - Bangalore - ID: 2
      ...

🏪 STORES
   Active Count: 7
   Sample Data:
      1. Gurgaon Mall Store (GGM_ST01) - retail - Gurgaon - ID: 1
      2. Bangalore Forum Store (BLR_ST01) - retail - Bangalore - ID: 2
      ...
```

## How Dropdown Selection Works

### Transfer Type Selection
When you click a transfer type button (W→W, W→S, S→W, S→S):

1. **Frontend** calls `fetchData()` function
2. **Frontend** makes API call to: `/api/transfer-suggestions/{transferType}`
3. **Backend** receives request and determines source/destination types
4. **Backend** queries database for warehouses or stores based on type
5. **Backend** returns JSON with sources and destinations arrays
6. **Frontend** populates dropdowns with returned data

### Dropdown Population Logic

```javascript
// When transfer type changes:
const transferType = 'warehouse-to-warehouse';

// API call:
GET /api/transfer-suggestions/warehouse-to-warehouse

// Backend logic:
if (transferType === 'warehouse-to-warehouse') {
    sourceType = 'warehouse';
    destinationType = 'warehouse';
}

// Database queries:
SELECT * FROM warehouses WHERE is_active = TRUE;  // For sources
SELECT * FROM warehouses WHERE is_active = TRUE;  // For destinations

// Response format:
{
    success: true,
    transferType: 'warehouse-to-warehouse',
    sourceType: 'warehouse',
    destinationType: 'warehouse',
    sources: [
        { id: 1, warehouse_code: 'GGM_WH', warehouse_name: 'Gurgaon Main Warehouse', ... },
        { id: 2, warehouse_code: 'BLR_WH', warehouse_name: 'Bangalore Warehouse', ... }
    ],
    destinations: [
        { id: 1, warehouse_code: 'GGM_WH', warehouse_name: 'Gurgaon Main Warehouse', ... },
        { id: 2, warehouse_code: 'BLR_WH', warehouse_name: 'Bangalore Warehouse', ... }
    ]
}
```

## Transfer Type Mapping

| Transfer Type | Source | Destination | API Endpoint |
|---|---|---|---|
| W→W | Warehouses | Warehouses | `/api/transfer-suggestions/warehouse-to-warehouse` |
| W→S | Warehouses | Stores | `/api/transfer-suggestions/warehouse-to-store` |
| S→W | Stores | Warehouses | `/api/transfer-suggestions/store-to-warehouse` |
| S→S | Stores | Stores | `/api/transfer-suggestions/store-to-store` |

## Testing Scenarios

### Scenario 1: W→W (Warehouse to Warehouse)
1. Click "W→W" button
2. Debug console shows: `🔄 Transfer type changed to: warehouse-to-warehouse`
3. API call: `GET /api/transfer-suggestions/warehouse-to-warehouse`
4. Source dropdown shows: 8 warehouses
5. Destination dropdown shows: 8 warehouses
6. Select "Gurgaon Main Warehouse" as source
7. Select "Bangalore Warehouse" as destination
8. Click swap button (⇄)
9. Source becomes "Bangalore Warehouse"
10. Destination becomes "Gurgaon Main Warehouse"

### Scenario 2: W→S (Warehouse to Store)
1. Click "W→S" button
2. Debug console shows: `🔄 Transfer type changed to: warehouse-to-store`
3. API call: `GET /api/transfer-suggestions/warehouse-to-store`
4. Source dropdown shows: 8 warehouses
5. Destination dropdown shows: 7 stores
6. Select "Gurgaon Main Warehouse" as source
7. Select "Gurgaon Mall Store" as destination
8. Click swap button (⇄)
9. Source becomes "Gurgaon Mall Store" (but this is invalid - should show error)
10. Destination becomes "Gurgaon Main Warehouse"

### Scenario 3: S→W (Store to Warehouse)
1. Click "S→W" button
2. Debug console shows: `🔄 Transfer type changed to: store-to-warehouse`
3. API call: `GET /api/transfer-suggestions/store-to-warehouse`
4. Source dropdown shows: 7 stores
5. Destination dropdown shows: 8 warehouses
6. Select "Gurgaon Mall Store" as source
7. Select "Bangalore Warehouse" as destination

### Scenario 4: S→S (Store to Store)
1. Click "S→S" button
2. Debug console shows: `🔄 Transfer type changed to: store-to-store`
3. API call: `GET /api/transfer-suggestions/store-to-store`
4. Source dropdown shows: 7 stores
5. Destination dropdown shows: 7 stores

## Debug Console Output

When you click "Create Transfer", the debug console shows:

```
🔄 Starting fetchData for transfer type: warehouse-to-warehouse
🔑 Token found: YES
📡 Calling API: http://localhost:5000/api/transfer-suggestions/warehouse-to-warehouse
📊 API Response Status: 200
📦 API Response Data: {success: true, ...}
✅ API Success - Sources: 8, Destinations: 8
  Source 0: Gurgaon Main Warehouse (GGM_WH) (ID: 1)
  Source 1: Bangalore Warehouse (BLR_WH) (ID: 2)
  Source 2: Mumbai Warehouse (MUM_WH) (ID: 3)
  Source 3: Ahmedabad Warehouse (AMD_WH) (ID: 4)
  Source 4: Hyderabad Warehouse (HYD_WH) (ID: 5)
  Source 5: Delhi Warehouse (DEL_WH) (ID: 6)
  Source 6: Chennai Warehouse (CHN_WH) (ID: 7)
  Source 7: Kolkata Warehouse (KOL_WH) (ID: 8)
  Destination 0: Gurgaon Main Warehouse (GGM_WH) (ID: 1)
  Destination 1: Bangalore Warehouse (BLR_WH) (ID: 2)
  ...
📡 Fetching products...
✅ Products loaded: 50
✅ fetchData completed
```

## Dropdown Selection Events

### When you click source dropdown:
```
📍 Source selected: 1
```

### When you click destination dropdown:
```
📍 Destination selected: 2
```

### When you click swap button:
```
🔄 Swapping source and destination
```

## Expected Dropdown Display Format

### Warehouse Format
```
Gurgaon Main Warehouse (GGM_WH)
Bangalore Warehouse (BLR_WH)
Mumbai Warehouse (MUM_WH)
```

### Store Format
```
Gurgaon Mall Store (GGM_ST01)
Bangalore Forum Store (BLR_ST01)
Mumbai Phoenix Store (MUM_ST01)
```

## Troubleshooting

### Problem: Dropdowns show "0 options"
**Cause**: Backend server not running
**Solution**: 
```bash
npm run server
```

### Problem: "No authentication token found"
**Cause**: Not logged in
**Solution**: 
1. Log in first
2. Token stored in localStorage
3. Try transfer module again

### Problem: API returns 500 error
**Cause**: Database connection issue
**Solution**:
1. Check database is running
2. Check credentials in .env.local
3. Run: `node verify-dropdown-data.js`

### Problem: Dropdowns show but no data
**Cause**: No warehouses/stores in database
**Solution**:
1. Run migration: `mysql -u inventory_user -p inventory_db < migrations/create-warehouse-store-management.sql`
2. Verify: `node verify-dropdown-data.js`

## Files Involved

### Frontend
- `src/app/inventory/SelfTransferModule.jsx` - Main component with dropdown logic

### Backend
- `routes/transferSuggestionsRoutes.js` - API endpoints
- `server.js` - Route registration (line 237)
- `db/connection.js` - Database connection

### Database
- `migrations/create-warehouse-store-management.sql` - Table creation and sample data

### Testing
- `test-transfer-suggestions.js` - API test script
- `verify-dropdown-data.js` - Database verification script
- `DROPDOWN_SELECTION_TEST_GUIDE.md` - Detailed test guide

## Key Code Sections

### Frontend - Fetch Data
```javascript
const fetchData = async () => {
    const apiUrl = `${API_BASE}/api/transfer-suggestions/${transferType}`;
    const res = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setSourceOptions(data.sources || []);
    setDestinationOptions(data.destinations || []);
};
```

### Backend - API Endpoint
```javascript
router.get('/:transferType', authenticateToken, (req, res) => {
    const { transferType } = req.params;
    
    // Determine source and destination types
    let sourceType, destinationType;
    
    // Fetch from database
    const sourceOptions = sourceType === 'warehouse' 
        ? getWarehouses() 
        : getStores();
    
    // Return response
    res.json({
        success: true,
        sources: sources,
        destinations: destinations
    });
});
```

## Next Steps

1. ✅ Start backend server: `npm run server`
2. ✅ Start frontend server: `npm run dev`
3. ✅ Verify database: `node verify-dropdown-data.js`
4. ✅ Test in UI: Navigate to Self Transfer Module
5. ✅ Check debug console for API calls
6. ✅ Test all 4 transfer types
7. ✅ Test swap button
8. ✅ Test form submission

## Success Criteria

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Database has 8 warehouses and 7 stores
- [ ] Debug console shows API calls
- [ ] Dropdowns populate with correct data
- [ ] Swap button works correctly
- [ ] All 4 transfer types work
- [ ] Form can be submitted
