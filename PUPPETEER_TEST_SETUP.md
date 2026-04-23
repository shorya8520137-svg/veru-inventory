# Puppeteer Dropdown Test - Setup & Run Guide

## Prerequisites
- Node.js installed
- Frontend running on http://localhost:3001
- Backend running on https://api.giftgala.in
- Test user account: `admin@company.com` / `Admin@123`

## Installation

### Step 1: Install Puppeteer
```bash
cd veru-inventory-main
npm install puppeteer
```

This will download Chromium browser (~150MB) and install Puppeteer.

### Step 2: Verify Setup
```bash
npm run dev
```

Make sure frontend is running on port 3001.

## Running the Test

### Option 1: Run with Browser UI (Recommended for First Test)
```bash
node test-dropdown-puppeteer.js
```

This will:
- Launch a visible browser window
- Show all interactions in real-time
- Display test results in console
- Generate a JSON report

### Option 2: Run Headless (Faster)
Edit `test-dropdown-puppeteer.js` line 11:
```javascript
headless: true // Change from false to true
```

Then run:
```bash
node test-dropdown-puppeteer.js
```

## What the Test Does

1. **Launch Browser**
   - Opens Chromium browser
   - Sets viewport to 1920x1080

2. **Login**
   - Navigates to login page
   - Enters credentials: admin@company.com / Admin@123
   - Submits login form

3. **Navigate to Self Transfer**
   - Goes to inventory page
   - Finds and clicks "Create Transfer" button

4. **Test All 4 Transfer Types**
   - W→W: Expects 5 sources, 5 destinations
   - W→S: Expects 5 sources, 9 destinations
   - S→W: Expects 9 sources, 5 destinations
   - S→S: Expects 9 sources, 9 destinations

5. **Test Swap Button**
   - Selects source and destination
   - Clicks swap button
   - Verifies values are exchanged

6. **Generate Report**
   - Saves results to `dropdown-test-report.json`
   - Displays summary in console

## Expected Output

```
============================================================
🧪 DROPDOWN SELECTION TEST - PUPPETEER
============================================================

[HH:MM:SS] 📝 Starting Dropdown Selection Test
[HH:MM:SS] 📝 Base URL: http://localhost:3001
[HH:MM:SS] 📝 Launching browser...
[HH:MM:SS] ✅ Browser launched
[HH:MM:SS] 📝 Navigating to login page...
[HH:MM:SS] ✅ Login form found
[HH:MM:SS] 📝 Filling login credentials...
[HH:MM:SS] 📝 Submitting login form...
[HH:MM:SS] ✅ Login successful
[HH:MM:SS] 📝 Navigating to Self Transfer module...

[HH:MM:SS] 🧪 Testing W→W (warehouse-to-warehouse)...
[HH:MM:SS] 📝 Sources: 5, Destinations: 5
[HH:MM:SS] ✅ W→W - PASSED (5 sources, 5 destinations)

[HH:MM:SS] 🧪 Testing W→S (warehouse-to-store)...
[HH:MM:SS] 📝 Sources: 5, Destinations: 9
[HH:MM:SS] ✅ W→S - PASSED (5 sources, 9 destinations)

[HH:MM:SS] 🧪 Testing S→W (store-to-warehouse)...
[HH:MM:SS] 📝 Sources: 9, Destinations: 5
[HH:MM:SS] ✅ S→W - PASSED (9 sources, 5 destinations)

[HH:MM:SS] 🧪 Testing S→S (store-to-store)...
[HH:MM:SS] 📝 Sources: 9, Destinations: 9
[HH:MM:SS] ✅ S→S - PASSED (9 sources, 9 destinations)

[HH:MM:SS] 🧪 Testing Swap Button...
[HH:MM:SS] 📝 Before swap - Source: 1, Dest: 2
[HH:MM:SS] 📝 After swap - Source: 2, Dest: 1
[HH:MM:SS] ✅ Swap Button - PASSED

[HH:MM:SS] ✅ All tests completed!

============================================================
📊 TEST REPORT
============================================================

Total Tests: 25
✅ Passed: 23
❌ Failed: 0
⚠️ Warnings: 2

📄 Report saved to: dropdown-test-report.json

============================================================
```

## Test Report File

The test generates `dropdown-test-report.json`:

```json
{
  "timestamp": "2026-04-23T12:00:00.000Z",
  "success": true,
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 0,
    "warnings": 2
  },
  "results": [
    {
      "timestamp": "12:00:00 PM",
      "message": "Starting Dropdown Selection Test",
      "type": "test"
    },
    ...
  ]
}
```

## Troubleshooting

### Issue: "Browser launch failed"
**Cause**: Chromium not installed
**Fix**: 
```bash
npm install puppeteer
```

### Issue: "Login failed"
**Cause**: Wrong credentials or user doesn't exist
**Fix**: 
1. Verify user exists in database:
   ```bash
   mysql -u inventory_user -pStrongPass@123 inventory_db
   SELECT * FROM users WHERE email = 'admin@company.com';
   ```
2. Update credentials in test script if needed

### Issue: "Create Transfer button not found"
**Cause**: Page structure different than expected
**Fix**: 
1. Manually navigate to Self Transfer module
2. Check button text and selector
3. Update test script accordingly

### Issue: "Dropdowns show 0 options"
**Cause**: Backend API not responding
**Fix**: 
1. Check backend is running: `npm run server`
2. Check database has data:
   ```bash
   mysql -u inventory_user -pStrongPass@123 inventory_db
   SELECT COUNT(*) FROM warehouses WHERE is_active = TRUE;
   SELECT COUNT(*) FROM stores WHERE is_active = TRUE;
   ```

### Issue: "Timeout waiting for element"
**Cause**: Page taking too long to load
**Fix**: 
1. Increase timeout in test script (line 10)
2. Check network speed
3. Verify frontend is responsive

## Advanced Options

### Run with Screenshots
Add to test script:
```javascript
await page.screenshot({ path: 'test-screenshot.png' });
```

### Run with Video Recording
Install `puppeteer-extra-plugin-stealth`:
```bash
npm install puppeteer-extra-plugin-stealth
```

### Run Multiple Times
```bash
for i in {1..5}; do
  echo "Run $i"
  node test-dropdown-puppeteer.js
done
```

## Success Criteria

- [x] Browser launches successfully
- [x] Login works
- [x] Self Transfer module loads
- [x] W→W shows 5 sources, 5 destinations
- [x] W→S shows 5 sources, 9 destinations
- [x] S→W shows 9 sources, 5 destinations
- [x] S→S shows 9 sources, 9 destinations
- [x] Swap button works
- [x] Test report generated

## Next Steps

1. Run the test: `node test-dropdown-puppeteer.js`
2. Check the output
3. Review `dropdown-test-report.json`
4. If all tests pass, dropdown logic is working! ✅
5. If tests fail, check troubleshooting section

## Support

For issues:
1. Check console output for error messages
2. Review `dropdown-test-report.json` for details
3. Check browser console (F12) for JavaScript errors
4. Verify backend API is responding
5. Check database has correct data
