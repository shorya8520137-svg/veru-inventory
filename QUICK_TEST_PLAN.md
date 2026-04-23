# 🚀 QUICK SELF TRANSFER TEST PLAN

## Step 1: Clean Database (Run via SSH)
```bash
ssh -i C:\Users\singh\.ssh\pem.pem ubuntu@54.254.254.75
sudo mysql inventory_db < /path/to/clean-store-inventory.sql
```

## Step 2: Test W to S Transfer
1. **Open Frontend**: Go to Transfer Stock button
2. **Select**: W to S (Warehouse to Store)
3. **Choose**: 
   - Source: BLR_WH
   - Destination: BLR_BROOKEFIELD
4. **Add Product**: iPhone 15 Pro Max | | 2460-3499
5. **Quantity**: 2
6. **Submit Transfer**

## Step 3: Verify Results
1. **Store Inventory Tab**: Should show iPhone with stock = 2
2. **Billing Tab**: Should show transfer entry
3. **Product Name**: Should show "iPhone 15 Pro Max" not "Unknown Product"

## Expected Results ✅
- ✅ Store inventory creates new product
- ✅ Product name shows correctly
- ✅ Stock = 2
- ✅ Billing entry created
- ✅ Fast rendering

## If Issues ❌
- Check browser console for errors
- Check server logs: `pm2 logs`
- Verify API response in Network tab

## Products Available for Testing:
- Samsung Galaxy S24 (2025-885) - Stock: 29
- iPhone 15 Pro Max (2460-3499) - Stock: 14  
- MacBook Air M3 (493-11471) - Stock: 3
- Dell XPS 13 (638-30500) - Stock: 10