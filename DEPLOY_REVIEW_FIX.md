# Deploy Review Controller Fix

## Issue
MySQL promise error when fetching reviews:
```
You have tried to call .then(), .catch(), or invoked await on the result of query that is not a promise
```

Then after fixing:
```
Error: Table 'inventory_db.product_reviews' doesn't exist
```

## Root Cause
1. The `db/connection.js` was using `mysql2` (callback-based) but the controller was using `await db.query()` with array destructuring, which requires `mysql2/promise`.
2. The `product_reviews` tables don't exist in the database yet.

## Fix Applied
1. Updated `db/connection.js` to use `mysql2/promise` instead of `mysql2`
2. Fixed corrupted SQL query in `controllers/reviewController.js`
3. Created SQL script to set up product reviews tables

## Deployment Steps

### On Server (18.143.133.96)

1. **Navigate to project directory:**
```bash
cd ~/inventoryfullstack
```

2. **Pull latest changes:**
```bash
git pull origin stocksphere-clean
```

3. **Create the database tables:**
```bash
sudo mysql inventory_db < create_product_reviews_tables.sql
```

Or use the setup script:
```bash
chmod +x setup-reviews-database.sh
./setup-reviews-database.sh
```

4. **Verify tables were created:**
```bash
sudo mysql inventory_db -e "SHOW TABLES LIKE '%review%';"
sudo mysql inventory_db -e "DESCRIBE product_reviews;"
```

5. **Restart backend server:**
```bash
pm2 restart backend
```

Or if backend is not running:
```bash
pm2 start server.js --name backend
```

6. **Check server status:**
```bash
pm2 status
pm2 logs backend --lines 50
```

7. **Test the fix:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://18.143.133.96:8443/api/admin/reviews?page=1
```

## Verify Fix

1. Open admin dashboard: https://18.143.133.96:8443/reviews
2. Check that reviews load without errors
3. Check server logs for any remaining errors

## Database Tables Created
- `product_reviews` - Main reviews table with ratings, comments, status
- `review_helpful` - Tracks which users found reviews helpful
- `review_images` - Optional table for review images

## Files Changed
- `db/connection.js` - Changed from `mysql2` to `mysql2/promise` for native promise support
- `controllers/reviewController.js` - Fixed SQL query in getProductReviews function
- `src/app/inventorygpt/page.jsx` - Fixed API endpoints to use public routes
- `create_product_reviews_tables.sql` - SQL script to create all review tables
- `setup-reviews-database.sh` - Bash script to automate table creation
