# Manual Fix Instructions for Review System

## Issue
The server's `reviewController.js` file has an issue causing the routes to fail.

## Quick Fix Option 1: Force Push Controller File

Run this command to copy the fixed controller to the server:

```powershell
scp -i "C:\Users\Public\e2c.pem.pem" controllers/reviewController.js ubuntu@18.143.133.96:~/inventoryfullstack/controllers/
```

Then restart the backend:
```powershell
ssh -i "C:\Users\Public\e2c.pem.pem" ubuntu@18.143.133.96 "pm2 restart backend"
```

## Quick Fix Option 2: Pull and Restart

If SSH is working again:
```powershell
ssh -i "C:\Users\Public\e2c.pem.pem" ubuntu@18.143.133.96 "cd ~/inventoryfullstack && git pull origin stocksphere-clean && pm2 restart backend"
```

## What Was Fixed

1. Changed from `users` table to `website_customers` table
2. Changed from `p.p_id` to `p.product_id` 
3. Changed from `u.username` to `wc.name`
4. Database tables recreated with correct foreign keys

## Verify Fix

After restarting, check logs:
```powershell
ssh -i "C:\Users\Public\e2c.pem.pem" ubuntu@18.143.133.96 "pm2 logs backend --lines 30"
```

Test the API:
```
https://18.143.133.96:8443/api/admin/reviews?page=1
```
