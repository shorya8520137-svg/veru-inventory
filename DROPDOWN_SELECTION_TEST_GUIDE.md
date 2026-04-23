# Dropdown Selection Logic Test Guide

## Overview
This guide explains how to test the dropdown selection logic for the Self Transfer Module.

## Prerequisites
1. **Backend Server Running**: `npm run server` (port 5000)
2. **Frontend Dev Server Running**: `npm run dev` (port 3000)
3. **Database**: Must have warehouses and stores data

## Test Steps

### Step 1: Verify Backend Server is Running
```bash
# In terminal 1
cd veru-inventory-main
npm run server
```

Expected output:
```
Server running on port 5000
🔌 Database connected
```

### Step 2: Verify Frontend Dev Server is Running
```bash
# In terminal 2
cd veru-inventory-main
npm run dev
```

Expected output:
```
▲ Next.js 16.1.6
- Local: http://localhost:3000
```

### Step 3: Test API Directly (Optional)
```bash
# In terminal 3
cd veru-inventory-main
node test-transfer-suggestions.js
```

This will test all 4 transfer types:
- W→W (warehouse-to-warehouse)
- W→S (warehouse-to-store)
- S→W (store-to-warehouse)
- S→S (store-to-store)

### Step 4: Test in Frontend UI

1. **Navigate to Self Transfer Module**
   - Go to: http://localhost:3000/inventory
   - Click "Create Transfer" button

2. **Test Transfer Type Selection**
   - Click on each transfer type button (W→W, W→S, S→W, S→S)
   - Watch the debug console at the top
   - Verify the transfer type changes

3. **Test Dropdown Population**
   - After selecting a transfer type, dropdowns should populate
   - Debug console should show:
     ```
     🔄 Starting fetchData for transfer type: warehouse-to-warehouse
     📡 Calling API: http://localhost:5000/api/transfer-suggestions/warehouse-to-warehouse
     📊 API Response Status: 200
     ✅ API Success - Sources: X, Destinations: Y
     ```

4. **Test Source Dropdown**
   - Click "Source Warehouse" dropdown
   - Should show list of warehouses
   - Each item should display: `Warehouse Name (CODE)`
   - Example: `Main Warehouse (WH-001)`

5. **Test Destination Dropdown**
   - Click "Destination Warehouse" dropdown
   - Should show list of warehouses
   - Each item should display: `Warehouse Name (CODE)`

6. **Test Swap Button (⇄)**
   - Select a source warehouse
   - Select a destination warehouse
   - Click the swap button (⇄)
   - Source and destination should exchange values

7. **Test Different Transfer Types**
   - **W→W**: Both dropdowns show warehouses
   - **W→S**: Source shows warehouses, destination shows stores
   - **S→W**: Source shows stores, destination shows warehouses
   - **S→S**: Both dropdowns show stores

## Expected Behavior

### Debug Console Output
When you click "Create Transfer", you should see:
```
🔄 Starting fetchData for transfer type: warehouse-to-warehouse
🔑 Token found: YES
📡 Calling API: http://localhost:5000/api/transfer-suggestions/warehouse-to-warehouse
📊 API Response Status: 200
📦 API Response Data: {success: true, ...}
✅ API Success - Sources: 5, Destinations: 5
  Source 0: Main Warehouse (WH-001) (ID: 1)
  Source 1: Branch Warehouse (WH-002) (ID: 2)
  ...
  Destination 0: Main Warehouse (WH-001) (ID: 1)
  ...
📡 Fetching products...
✅ Products loaded: 50
✅ fetchData completed
```

### Dropdown Display
- **Source Dropdown**: Shows 5+ options (warehouses or stores based on transfer type)
- **Destination Dropdown**: Shows 5+ options (warehouses or stores based on transfer type)
- **Format**: `Name (CODE)` - e.g., "Main Warehouse (WH-001)"

## Troubleshooting

### Issue: Dropdowns Show "0 options"
**Cause**: Backend server not running
**Fix**: 
```bash
npm run server
```

### Issue: "No authentication token found"
**Cause**: Not logged in
**Fix**: 
1. Log in to the application first
2. Token will be stored in localStorage
3. Then try the transfer module

### Issue: API returns 404
**Cause**: Route not registered in server.js
**Fix**: Verify line 237 in server.js:
```javascript
app.use('/api/transfer-suggestions', require('./routes/transferSuggestionsRoutes'));
```

### Issue: Database error in debug console
**Cause**: Warehouses or stores table is empty
**Fix**: 
1. Check database has data:
   ```sql
   SELECT COUNT(*) FROM warehouses WHERE is_active = TRUE;
   SELECT COUNT(*) FROM stores WHERE is_active = TRUE;
   ```
2. If empty, add sample data using warehouse management UI

## Test Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend dev server running on port 3000
- [ ] Can navigate to Self Transfer Module
- [ ] Debug console shows API calls
- [ ] W→W: Both dropdowns show warehouses
- [ ] W→S: Source shows warehouses, destination shows stores
- [ ] S→W: Source shows stores, destination shows warehouses
- [ ] S→S: Both dropdowns show stores
- [ ] Swap button exchanges source and destination
- [ ] Can select items from dropdowns
- [ ] Can add multiple items
- [ ] Can submit transfer form

## API Endpoints Being Tested

1. **GET /api/transfer-suggestions/warehouse-to-warehouse**
   - Returns: warehouses as sources, warehouses as destinations

2. **GET /api/transfer-suggestions/warehouse-to-store**
   - Returns: warehouses as sources, stores as destinations

3. **GET /api/transfer-suggestions/store-to-warehouse**
   - Returns: stores as sources, warehouses as destinations

4. **GET /api/transfer-suggestions/store-to-store**
   - Returns: stores as sources, stores as destinations

## Database Tables Required

1. **warehouses** table
   - Columns: id, code, name, location, city, state, country, manager_name, capacity, is_active
   - Must have: is_active = TRUE records

2. **stores** table
   - Columns: id, store_code, store_name, store_type, address, city, state, country, manager_name, area_sqft, is_active
   - Must have: is_active = TRUE records

## Notes

- The debug console is always visible at the top of the form
- All API calls are logged with timestamps
- Each dropdown selection is logged in the debug console
- The swap button logs when it's clicked
- Transfer type changes are logged
