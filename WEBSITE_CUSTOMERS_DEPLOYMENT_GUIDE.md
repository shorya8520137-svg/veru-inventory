# Website Customers Management - Deployment Guide

## ✅ What Was Created

### Backend Files
1. **Controller**: `controllers/websiteCustomersController.js`
   - Get all customers with pagination and filters
   - Get customer statistics
   - Get customer by ID
   - Suspend/Activate customer
   - Get recent logins
   - Delete customer (soft delete)

2. **Routes**: `routes/websiteCustomersRoutes.js`
   - All routes with JWT authentication
   - RESTful API design

3. **Database Schema**: `website-customers-schema.sql`
   - Complete table structure
   - Indexes for performance

4. **Server Integration**: Updated `server.js`
   - Added route: `/api/website-customers`

### Frontend Files
1. **Management Page**: `src/app/website-customers/page.jsx`
   - Statistics dashboard
   - Customer list with pagination
   - Search and filter functionality
   - Suspend/Activate buttons
   - Responsive design

2. **API Documentation**: Updated `src/app/api/page.jsx`
   - Added Website Customers API section
   - Copy-to-clipboard functionality

### Documentation
1. `WEBSITE_CUSTOMERS_API_DOCUMENTATION.md` - Complete API docs
2. `WEBSITE_CUSTOMERS_DEPLOYMENT_GUIDE.md` - This file

---

## 🚀 Deployment Steps

### Step 1: Create Database Table

SSH into your server:
```bash
ssh ubuntu@54.254.184.54
```

Run the SQL script:
```bash
cd /home/ubuntu/hunyhunydump/inventoryfullstack

mysql -u root -p inventory_db < website-customers-schema.sql
```

Or manually in MySQL:
```sql
USE inventory_db;

CREATE TABLE IF NOT EXISTS website_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);
```

Verify table creation:
```sql
DESCRIBE website_customers;
```

### Step 2: Deploy Backend

Pull latest code:
```bash
cd /home/ubuntu/hunyhunydump/inventoryfullstack
git fetch origin
git pull origin stocksphere-phase-1-complete
```

Restart the server:
```bash
pm2 restart all
```

Check logs:
```bash
pm2 logs dashboard-api-1 --lines 50
```

### Step 3: Test Backend API

Test statistics endpoint:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://54.254.184.54:8443/api/website-customers/stats
```

Expected response:
```json
{
  "success": true,
  "data": {
    "total_customers": 0,
    "active_customers": 0,
    "suspended_customers": 0,
    "google_signups": 0,
    "today_signups": 0,
    "week_signups": 0,
    "month_signups": 0
  }
}
```

### Step 4: Deploy Frontend

Frontend will auto-deploy via Vercel when you push to GitHub.

Check deployment status:
1. Go to https://vercel.com/dashboard
2. Find project: inventoryfullstack-one
3. Wait for "Ready" status (2-5 minutes)

### Step 5: Verify Frontend

Visit the page:
```
https://inventoryfullstack-one.vercel.app/website-customers
```

You should see:
- ✅ Statistics dashboard (all zeros if no customers yet)
- ✅ Search and filter controls
- ✅ Empty state message: "No customers found"

### Step 6: Check API Documentation

Visit:
```
https://inventoryfullstack-one.vercel.app/api
```

Scroll down to find:
- **👥 Website Customers API** section
- All 5 endpoints with copy buttons

---

## 🧪 Testing

### 1. Insert Test Customer

```sql
INSERT INTO website_customers (name, email, phone, password_hash, is_active)
VALUES ('Test User', 'test@example.com', '+1234567890', 'hashed_password_here', TRUE);
```

### 2. Test API Endpoints

**Get all customers:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://54.254.184.54:8443/api/website-customers?page=1&limit=10"
```

**Get statistics:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://54.254.184.54:8443/api/website-customers/stats
```

**Suspend customer:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}' \
  https://54.254.184.54:8443/api/website-customers/1/status
```

### 3. Test Frontend

1. Login to dashboard
2. Navigate to Website Customers page
3. You should see the test customer
4. Try searching for "test"
5. Try filtering by "Active"
6. Click "Suspend" button
7. Verify status changes to "Suspended"
8. Click "Activate" button
9. Verify status changes back to "Active"

---

## 📊 Features

### Statistics Dashboard
- **Total Customers**: All registered customers
- **Active Customers**: Customers with is_active = TRUE
- **Suspended Customers**: Customers with is_active = FALSE
- **This Month**: Signups in last 30 days

### Customer Management
- **Search**: By name, email, or phone
- **Filter**: All / Active / Suspended
- **Pagination**: 20 customers per page
- **Actions**: Suspend or Activate accounts

### API Features
- **Pagination**: Efficient data loading
- **Search**: Full-text search across multiple fields
- **Filtering**: Status-based filtering
- **Statistics**: Real-time customer metrics
- **Recent Logins**: Track customer activity

---

## 🔒 Security

1. **JWT Authentication**: All endpoints require valid JWT token
2. **Password Security**: Passwords never returned in API responses
3. **Soft Delete**: Uses is_active flag instead of hard delete
4. **Unique Constraints**: Email and phone must be unique
5. **Indexes**: Fast lookups on email and phone

---

## 🐛 Troubleshooting

### Backend Issues

**Error: Table doesn't exist**
```bash
# Check if table exists
mysql -u root -p inventory_db -e "SHOW TABLES LIKE 'website_customers';"

# If not, create it
mysql -u root -p inventory_db < website-customers-schema.sql
```

**Error: 401 Unauthorized**
```bash
# Check if JWT token is valid
# Get new token by logging in again
```

**Error: 500 Internal Server Error**
```bash
# Check server logs
pm2 logs dashboard-api-1 --lines 100

# Check database connection
mysql -u root -p inventory_db -e "SELECT 1;"
```

### Frontend Issues

**Page shows "Application error"**
- Clear browser cache (Ctrl + Shift + R)
- Wait for Vercel deployment to complete
- Check browser console for errors

**API calls fail**
- Check if logged in (JWT token exists)
- Verify API_BASE URL is correct
- Check network tab in browser DevTools

---

## 📝 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/website-customers` | Get all customers (paginated) |
| GET | `/api/website-customers/stats` | Get customer statistics |
| GET | `/api/website-customers/recent-logins` | Get recent login activity |
| GET | `/api/website-customers/:id` | Get single customer |
| PATCH | `/api/website-customers/:id/status` | Suspend/Activate customer |
| DELETE | `/api/website-customers/:id` | Delete customer (soft) |

---

## 📦 Files Modified/Created

### Backend
- ✅ `controllers/websiteCustomersController.js` (NEW)
- ✅ `routes/websiteCustomersRoutes.js` (NEW)
- ✅ `website-customers-schema.sql` (NEW)
- ✅ `server.js` (MODIFIED - added route)

### Frontend
- ✅ `src/app/website-customers/page.jsx` (NEW)
- ✅ `src/app/api/page.jsx` (MODIFIED - added API docs)

### Documentation
- ✅ `WEBSITE_CUSTOMERS_API_DOCUMENTATION.md` (NEW)
- ✅ `WEBSITE_CUSTOMERS_DEPLOYMENT_GUIDE.md` (NEW)

---

## ✨ Next Steps

1. **Add to Sidebar**: Add "Website Customers" link to navigation
2. **Permissions**: Add permission check for customer management
3. **Export**: Add CSV export functionality
4. **Email**: Add email notification for suspended accounts
5. **Analytics**: Add customer behavior analytics

---

## 🎯 Commit Details

**Branch**: `stocksphere-phase-1-complete`
**Commit**: `5e78e1b`
**Message**: "Add Website Customers Management System - Backend API, Frontend Page, and Documentation"
**Date**: February 9, 2026

---

## 📞 Support

If you encounter issues:
1. Check server logs: `pm2 logs dashboard-api-1`
2. Check browser console (F12)
3. Verify database table exists
4. Ensure JWT token is valid
5. Check Vercel deployment status

---

**Deployment Complete! 🎉**

Access the page at: https://inventoryfullstack-one.vercel.app/website-customers
