# 🚀 Quick Test Reference Card

## One-Line Test Command
```bash
npm install puppeteer && node test-dropdown-puppeteer.js
```

## What Gets Tested
✅ W→W: 5 warehouses → 5 warehouses
✅ W→S: 5 warehouses → 9 stores
✅ S→W: 9 stores → 5 warehouses
✅ S→S: 9 stores → 9 stores
✅ Swap button functionality

## Expected Output
```
✅ W→W - PASSED (5 sources, 5 destinations)
✅ W→S - PASSED (5 sources, 9 destinations)
✅ S→W - PASSED (9 sources, 5 destinations)
✅ S→S - PASSED (9 sources, 9 destinations)
✅ Swap Button - PASSED
✅ All tests completed!
```

## Test Report Location
`dropdown-test-report.json`

## Manual Test (No Script)
1. Open http://localhost:3001
2. Login: admin@company.com / Admin@123
3. Go to Inventory → Self Transfer
4. Click "Create Transfer"
5. Test each W→W, W→S, S→W, S→S button
6. Verify dropdowns populate
7. Test swap button (⇄)

## If Tests Fail
1. Check backend: `npm run server`
2. Check database: `mysql -u inventory_user -pStrongPass@123 inventory_db -e "SELECT COUNT(*) FROM warehouses WHERE is_active = TRUE;"`
3. Check frontend: http://localhost:3001 (should load)
4. Check logs: `pm2 logs server`

## Files to Know
- Test script: `test-dropdown-puppeteer.js`
- API fixed: `routes/transferSuggestionsRoutes.js`
- Frontend: `src/app/inventory/SelfTransferModule.jsx`
- Full docs: `DROPDOWN_SELECTION_FINAL_SUMMARY.md`

## Success = All Tests Pass ✅
