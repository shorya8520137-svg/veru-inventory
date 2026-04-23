# Frontend Dropdown Selection Test

## Quick Test Steps

### 1. Open Frontend in Browser
```
http://localhost:3000
```

### 2. Log In
- Email: `admin@company.com`
- Password: `Admin@123`

### 3. Navigate to Self Transfer Module
- Go to: **Inventory** → **Self Transfer** (or similar path)
- Click **"Create Transfer"** button

### 4. Test Dropdown Selection

#### Test 1: W→W (Warehouse to Warehouse)
1. Click **"W→W"** button
2. Watch debug console at top
3. Should see:
   - ✅ API call to `/api/transfer-suggestions/warehouse-to-warehouse`
   - ✅ Sources: 5 warehouses
   - ✅ Destinations: 5 warehouses
4. Click source dropdown → should show 5 warehouses
5. Click destination dropdown → should show 5 warehouses

#### Test 2: W→S (Warehouse to Store)
1. Click **"W→S"** button
2. Debug console should show:
   - ✅ API call to `/api/transfer-suggestions/warehouse-to-store`
   - ✅ Sources: 5 warehouses
   - ✅ Destinations: 9 stores
3. Source dropdown → 5 warehouses
4. Destination dropdown → 9 stores

#### Test 3: S→W (Store to Warehouse)
1. Click **"S→W"** button
2. Debug console should show:
   - ✅ API call to `/api/transfer-suggestions/store-to-warehouse`
   - ✅ Sources: 9 stores
   - ✅ Destinations: 5 warehouses
3. Source dropdown → 9 stores
4. Destination dropdown → 5 warehouses

#### Test 4: S→S (Store to Store)
1. Click **"S→S"** button
2. Debug console should show:
   - ✅ API call to `/api/transfer-suggestions/store-to-store`
   - ✅ Sources: 9 stores
   - ✅ Destinations: 9 stores
3. Source dropdown → 9 stores
4. Destination dropdown → 9 stores

### 5. Test Swap Button
1. Select a source (e.g., "Gurgaon Warehouse")
2. Select a destination (e.g., "Bangalore Warehouse")
3. Click swap button (⇄)
4. Source should become "Bangalore Warehouse"
5. Destination should become "Gurgaon Warehouse"

### 6. Test Form Submission
1. Select source and destination
2. Add items to transfer
3. Click "Initiate Transfer"
4. Should see success message

## Expected Debug Console Output

```
[HH:MM:SS] 🔄 Starting fetchData for transfer type: warehouse-to-warehouse
[HH:MM:SS] 🔑 Token found: YES
[HH:MM:SS] 📡 Calling API: https://api.giftgala.in/api/transfer-suggestions/warehouse-to-warehouse
[HH:MM:SS] 📊 API Response Status: 200
[HH:MM:SS] 📦 API Response Data: {success: true, ...}
[HH:MM:SS] ✅ API Success - Sources: 5, Destinations: 5
[HH:MM:SS]   Source 0: Gurgaon Warehouse (GGM_WH) (ID: 1)
[HH:MM:SS]   Source 1: Bangalore Warehouse (BLR_WH) (ID: 2)
[HH:MM:SS]   Source 2: Mumbai Warehouse (MUM_WH) (ID: 3)
[HH:MM:SS]   Source 3: Ahmedabad Warehouse (AMD_WH) (ID: 4)
[HH:MM:SS]   Source 4: Hyderabad Warehouse (HYD_WH) (ID: 5)
[HH:MM:SS]   Destination 0: Gurgaon Warehouse (GGM_WH) (ID: 1)
[HH:MM:SS]   Destination 1: Bangalore Warehouse (BLR_WH) (ID: 2)
[HH:MM:SS]   Destination 2: Mumbai Warehouse (MUM_WH) (ID: 3)
[HH:MM:SS]   Destination 3: Ahmedabad Warehouse (AMD_WH) (ID: 4)
[HH:MM:SS]   Destination 4: Hyderabad Warehouse (HYD_WH) (ID: 5)
[HH:MM:SS] 📡 Fetching products...
[HH:MM:SS] ✅ Products loaded: 50
[HH:MM:SS] ✅ fetchData completed
```

## Expected Dropdown Display

### Warehouse Format
```
Gurgaon Warehouse (GGM_WH)
Bangalore Warehouse (BLR_WH)
Mumbai Warehouse (MUM_WH)
Ahmedabad Warehouse (AMD_WH)
Hyderabad Warehouse (HYD_WH)
```

### Store Format
```
Gurgaon Mall Store (GGM_ST01)
Bangalore Forum Store (BLR_ST01)
Mumbai Phoenix Store (MUM_ST01)
Delhi CP Store (DEL_ST01)
Chennai Express Store (CHN_ST01)
Gurgaon Wholesale Hub (GGM_WS01)
Bangalore Wholesale Center (BLR_WS01)
```

## Troubleshooting

### Issue: Dropdowns show "0 options"
**Solution**: 
1. Check backend server is running: `npm run server`
2. Check frontend can reach API: Open browser console (F12)
3. Look for network errors in Network tab

### Issue: "No authentication token found"
**Solution**:
1. Log in first
2. Token will be stored in localStorage
3. Try again

### Issue: API returns 401 Unauthorized
**Solution**:
1. Token may have expired
2. Log out and log in again
3. Try the transfer module again

### Issue: Dropdowns show but no data
**Solution**:
1. Check database has warehouses/stores:
   ```bash
   mysql -u inventory_user -pStrongPass@123 inventory_db
   SELECT COUNT(*) FROM warehouses WHERE is_active = TRUE;
   SELECT COUNT(*) FROM stores WHERE is_active = TRUE;
   ```
2. If empty, add sample data using warehouse management UI

## Alternative Test Method

Use the HTML test page:
```
http://localhost:3000/test-dropdown-frontend.html
```

This page:
- Tests all 4 transfer types
- Shows real-time debug console
- Displays sources and destinations
- No need to navigate through UI

## Success Criteria

- [ ] W→W shows 5 warehouses for both source and destination
- [ ] W→S shows 5 warehouses for source, 9 stores for destination
- [ ] S→W shows 9 stores for source, 5 warehouses for destination
- [ ] S→S shows 9 stores for both source and destination
- [ ] Swap button exchanges source and destination
- [ ] Debug console shows all API calls
- [ ] Form can be submitted successfully
- [ ] Transfer is created in database

## Database Data

### Warehouses (5 total)
1. Gurgaon Warehouse (GGM_WH)
2. Bangalore Warehouse (BLR_WH)
3. Mumbai Warehouse (MUM_WH)
4. Ahmedabad Warehouse (AMD_WH)
5. Hyderabad Warehouse (HYD_WH)

### Stores (9 total)
1. Gurgaon Mall Store (GGM_ST01) - retail
2. Bangalore Forum Store (BLR_ST01) - retail
3. Mumbai Phoenix Store (MUM_ST01) - retail
4. Delhi CP Store (DEL_ST01) - retail
5. Chennai Express Store (CHN_ST01) - retail
6. Gurgaon Wholesale Hub (GGM_WS01) - wholesale
7. Bangalore Wholesale Center (BLR_WS01) - wholesale
8. Delhi Wholesale Hub (DEL_WS01) - wholesale
9. Mumbai Wholesale Center (MUM_WS01) - wholesale
