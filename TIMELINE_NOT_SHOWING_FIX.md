# Timeline Not Showing - Quick Fix Guide

## Problem
Store inventory page mein timeline show nahi ho rahi hai.

## Why Timeline is Not Showing

### Reason 1: Database Table Missing ❌
`store_timeline` table abhi create nahi hua hai production database mein.

**Check karo:**
```sql
SHOW TABLES LIKE 'store_timeline';
```

Agar empty result aaye, to table nahi hai.

### Reason 2: No Timeline Data ❌
Table exist karta hai but usme data nahi hai.

**Check karo:**
```sql
SELECT COUNT(*) FROM store_timeline;
```

Agar 0 aaye, to data nahi hai.

### Reason 3: API Route Not Registered ❌
`/api/store-timeline` route register nahi hua server mein.

**Check karo:**
```bash
grep -r "storeTimelineRoutes" server.js
```

## Quick Fix Solutions

### Solution 1: Run Setup Script (Recommended) ✅

**Option A: Via SSH (Production Server)**
```powershell
cd veru-inventory-main
.\setup-store-timeline-via-ssh.ps1
```

**Option B: Direct Database Access**
```powershell
cd veru-inventory-main
.\setup-store-timeline.ps1
```

**Option C: Manual SQL**
```bash
mysql -u username -p database_name < setup-store-timeline.sql
```

### Solution 2: Create Table Manually ✅

```sql
-- Connect to your database
mysql -u username -p database_name

-- Run this SQL
CREATE TABLE IF NOT EXISTS store_timeline (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_code VARCHAR(100) NOT NULL,
  product_barcode VARCHAR(255) NOT NULL,
  product_name VARCHAR(255),
  movement_type ENUM('OPENING', 'SELF_TRANSFER', 'DISPATCH', 'RETURN', 'DAMAGE', 'RECOVER', 'MANUAL') NOT NULL,
  direction ENUM('IN', 'OUT') NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  balance_after INT UNSIGNED NOT NULL,
  reference VARCHAR(255),
  user_id VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_store_product (store_code, product_barcode),
  INDEX idx_created_at (created_at),
  INDEX idx_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Populate with existing inventory
INSERT INTO store_timeline (
    store_code, product_barcode, product_name, movement_type, direction,
    quantity, balance_after, reference, user_id, created_at
)
SELECT 
    'STORE_DEFAULT', barcode, product_name, 'OPENING', 'IN',
    stock, stock, 'INITIAL_STOCK', 'system', created_at
FROM store_inventory
WHERE stock > 0
AND NOT EXISTS (
    SELECT 1 FROM store_timeline st 
    WHERE st.product_barcode = store_inventory.barcode 
    AND st.movement_type = 'OPENING'
);

-- Verify
SELECT COUNT(*) as total_entries FROM store_timeline;
SELECT * FROM store_timeline LIMIT 5;
```

### Solution 3: Restart Application ✅

After creating the table, restart your Node.js application:

```bash
# If using PM2
pm2 restart veru-inventory

# If using npm
npm run start

# If using Docker
docker-compose restart veru-inventory
```

## Verification Steps

### Step 1: Check Database
```sql
-- Check table exists
SHOW TABLES LIKE 'store_timeline';

-- Check data exists
SELECT COUNT(*) FROM store_timeline;

-- View sample data
SELECT * FROM store_timeline ORDER BY created_at DESC LIMIT 10;
```

### Step 2: Check API Endpoint
```bash
# Test the API
curl http://localhost:3000/api/store-timeline/STORE_DEFAULT?limit=10

# Should return JSON with timeline data
```

### Step 3: Check Browser Console
1. Open Store Inventory page
2. Open browser console (F12)
3. Look for API calls to `/api/store-timeline/`
4. Check for errors

**Expected:**
```
Store Timeline API response: {success: true, data: {...}}
```

**If Error:**
```
Error fetching timeline: HTTP 404
```
→ Route not registered, restart application

```
Error fetching timeline: HTTP 500
```
→ Database error, check table exists

## What Timeline Will Show

After setup, timeline will display:

### Initial Stock Entries
- **Movement Type:** OPENING
- **Direction:** IN
- **Quantity:** Current stock from store_inventory
- **Badge:** "Initial Stock" (blue)

### Future Transfer Entries
After you perform store-to-store transfers using the new billing integration:
- **Movement Type:** SELF_TRANSFER
- **Direction:** IN or OUT
- **Quantity:** Transfer quantity
- **Badge:** "Store Transfer" (purple)
- **Reference:** Transfer ID (e.g., STF-1234567890)

## Timeline UI Features

Once working, you'll see:

✅ **Product Details**
- Product name (bold)
- Product barcode (SKU)

✅ **Movement Info**
- Movement type (SELF_TRANSFER, OPENING, etc.)
- Direction (IN/OUT)
- Quantity (color-coded: green for IN, red for OUT)

✅ **Stock Tracking**
- Stock before movement
- Stock after movement

✅ **Audit Trail**
- Timestamp
- User who performed action
- Reference number

✅ **Visual Timeline**
- Vertical timeline with icons
- Color-coded event cards
- Status badges

## Common Issues & Solutions

### Issue 1: "No timeline events found"

**Cause:** Table empty or doesn't exist

**Solution:**
```sql
-- Check if table exists
SHOW TABLES LIKE 'store_timeline';

-- If exists but empty, populate it
INSERT INTO store_timeline (
    store_code, product_barcode, product_name, movement_type, direction,
    quantity, balance_after, reference, user_id, created_at
)
SELECT 
    'STORE_DEFAULT', barcode, product_name, 'OPENING', 'IN',
    stock, stock, 'INITIAL_STOCK', 'system', NOW()
FROM store_inventory
WHERE stock > 0;
```

### Issue 2: API returns 404

**Cause:** Route not registered

**Solution:**
```javascript
// Check server.js has this line:
app.use('/api/store-timeline', require('./routes/storeTimelineRoutes'));

// If missing, add it and restart
```

### Issue 3: API returns 500

**Cause:** Database connection error or table doesn't exist

**Solution:**
```bash
# Check database connection
node -e "const db = require('./src/lib/db'); db.query('SELECT 1', (err) => console.log(err ? 'Error: ' + err : 'Connected'));"

# Check table exists
mysql -u username -p -e "USE database_name; SHOW TABLES LIKE 'store_timeline';"
```

### Issue 4: Timeline shows but no data

**Cause:** No movements recorded yet

**Solution:**
```sql
-- Add sample data for testing
INSERT INTO store_timeline (
    store_code, product_barcode, product_name, movement_type, direction,
    quantity, balance_after, reference, user_id
) VALUES (
    'STORE_DEFAULT', '361313801009', 'Test Product', 'OPENING', 'IN',
    10, 10, 'TEST-001', 'admin'
);
```

## Testing Timeline

### Test 1: View Timeline
1. Navigate to Store Inventory page
2. Select a store from dropdown
3. Timeline should load and show entries

### Test 2: Perform Transfer
1. Go to Products → Transfer
2. Create store-to-store transfer
3. Check source store timeline (should show OUT entry)
4. Check destination store timeline (should show IN entry)

### Test 3: Verify Data
```sql
-- Check latest timeline entries
SELECT 
    store_code,
    product_name,
    movement_type,
    direction,
    quantity,
    balance_after,
    created_at
FROM store_timeline
ORDER BY created_at DESC
LIMIT 10;
```

## Next Steps After Fix

1. ✅ **Verify Timeline Works**
   - Open Store Inventory page
   - Select store
   - See timeline entries

2. ✅ **Test Store Transfer**
   - Perform a store-to-store transfer
   - Check both stores' timelines
   - Verify entries created

3. ✅ **Deploy New Routes**
   - Run `.\deploy-store-inventory-fix.ps1`
   - This will enable billing integration
   - Future transfers will automatically create timeline entries

4. ✅ **Monitor**
   - Check timeline after each transfer
   - Verify stock levels match
   - Ensure no errors in logs

## Summary

**Problem:** Timeline not showing  
**Root Cause:** `store_timeline` table doesn't exist  
**Solution:** Run `setup-store-timeline.sql` or `setup-store-timeline-via-ssh.ps1`  
**Result:** Timeline will show existing inventory as "Initial Stock" entries  

**After fix, timeline will display:**
- ✅ Existing inventory (as OPENING entries)
- ✅ Future transfers (as SELF_TRANSFER entries)
- ✅ Product details, quantities, stock levels
- ✅ Complete audit trail with timestamps and users

---

## Quick Command Reference

```bash
# Check table exists
mysql -u user -p -e "USE dbname; SHOW TABLES LIKE 'store_timeline';"

# Create table
mysql -u user -p dbname < setup-store-timeline.sql

# Check data
mysql -u user -p -e "USE dbname; SELECT COUNT(*) FROM store_timeline;"

# Restart app
pm2 restart veru-inventory

# Test API
curl http://localhost:3000/api/store-timeline/STORE_DEFAULT
```

**Abhi run karo setup script aur timeline aa jayegi!** 🚀
