# Transfer Suggestions API - Troubleshooting Guide

## Problem Analysis

### Issue
Dropdowns in Self Transfer Module show **0 options** when user clicks "Create Transfer"

### Root Cause
**Backend server is NOT RUNNING**

The frontend is trying to call `/api/transfer-suggestions/warehouse-to-warehouse` but the backend server is down, so the API returns 404 or connection error.

### Evidence
1. ✅ Route IS registered in `server.js` (line 237)
2. ✅ API file exists: `routes/transferSuggestionsRoutes.js`
3. ✅ Helper functions exist: `getWarehouses()` and `getStores()`
4. ❌ Backend server process is NOT running
5. ❌ No API responses being received by frontend

## Solution

### Step 1: Start Backend Server

```bash
npm run server
```

Or use the batch file:
```bash
START_BACKEND.cmd
```

### Step 2: Verify Server is Running

Check for output like:
```
🚀 Inventory Backend Started
🌍 Port: 5000
```

### Step 3: Test API Endpoint

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/transfer-suggestions/warehouse-to-warehouse
```

Expected response:
```json
{
  "success": true,
  "transferType": "warehouse-to-warehouse",
  "sourceType": "warehouse",
  "destinationType": "warehouse",
  "sources": [...],
  "destinations": [...]
}
```

### Step 4: Test in Frontend

1. Open Self Transfer Module
2. Click "Create Transfer"
3. Check debug console for logs
4. Dropdowns should now populate

## Debugging Checklist

- [ ] Backend server is running (`npm run server`)
- [ ] No errors in backend console
- [ ] Frontend debug console shows API calls
- [ ] API returns 200 status code
- [ ] Warehouses/stores exist in database
- [ ] Token is valid and not expired

## Common Issues

### Issue 1: "Cannot find module 'passport'"
**Solution:** Install dependencies
```bash
npm install
```

### Issue 2: "Database connection failed"
**Solution:** Check database credentials in `.env.local`
```
DB_HOST=api.giftgala.in
DB_USER=inventory_user
DB_PASSWORD=StrongPass@123
DB_NAME=inventory_db
```

### Issue 3: "API returns empty arrays"
**Solution:** Check if warehouses/stores exist in database
```sql
SELECT COUNT(*) FROM warehouses WHERE is_active = TRUE;
SELECT COUNT(*) FROM stores WHERE is_active = TRUE;
```

### Issue 4: "401 Unauthorized"
**Solution:** Check authentication token
- Token must be valid JWT
- Token must not be expired
- Token must be in Authorization header

## API Endpoints

### Get Suggestions
```
GET /api/transfer-suggestions/:transferType
```

**Transfer Types:**
- `warehouse-to-warehouse`
- `warehouse-to-store`
- `store-to-warehouse`
- `store-to-store`

**Response:**
```json
{
  "success": true,
  "transferType": "warehouse-to-warehouse",
  "sourceType": "warehouse",
  "destinationType": "warehouse",
  "sources": [
    {
      "id": 1,
      "warehouse_code": "WH001",
      "warehouse_name": "Main Warehouse",
      "location": "Delhi",
      "city": "Delhi",
      "state": "Delhi",
      "country": "India",
      "manager_name": "John Doe",
      "capacity": 10000,
      "is_active": true,
      "created_at": "2026-04-23T10:30:00Z"
    }
  ],
  "destinations": [...]
}
```

## Debug Console

The frontend has a built-in debug console that shows:
- ✅ API calls being made
- ✅ Response status codes
- ✅ Number of options loaded
- ✅ Errors with details

**How to use:**
1. Open Self Transfer Module
2. Click "Create Transfer"
3. Look at the GREEN DEBUG CONSOLE at the top
4. Watch logs as you interact

## Files Involved

### Backend
- `routes/transferSuggestionsRoutes.js` - API implementation
- `server.js` - Route registration (line 237)
- `db/connection.js` - Database connection

### Frontend
- `src/app/inventory/SelfTransferModule.jsx` - UI with debug console
- `src/app/inventory/StoreTimeline.jsx` - Timeline view

### Database
- `warehouses` table - Warehouse data
- `stores` table - Store data

## Next Steps

1. **Start backend server**
   ```bash
   npm run server
   ```

2. **Verify in browser**
   - Open Self Transfer Module
   - Click "Create Transfer"
   - Check debug console
   - Select transfer type
   - Dropdowns should populate

3. **If still not working**
   - Check backend console for errors
   - Check browser console (F12)
   - Check debug console in UI
   - Verify database has data

## Support

For more help:
- Check `TRANSFER_SUGGESTIONS_API.md` for API documentation
- Check `SELF_TRANSFER_IMPLEMENTATION_GUIDE.md` for implementation details
- Check browser console (F12) for JavaScript errors
- Check backend console for server errors

---

**Status:** ✅ SOLUTION IDENTIFIED  
**Action Required:** Start backend server with `npm run server`
