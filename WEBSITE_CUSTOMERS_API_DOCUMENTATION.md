# Website Customers API Documentation

Complete API documentation for managing website customer accounts.

## Table of Contents
1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Frontend Page](#frontend-page)
4. [Deployment](#deployment)

---

## Database Schema

```sql
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

---

## API Endpoints

### Base URL
```
https://54.254.184.54:8443/api/website-customers
```

### Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### 1. Get All Customers

**Endpoint:** `GET /api/website-customers`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search by name, email, or phone
- `status` (optional): Filter by status (`all`, `active`, `inactive`)

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://54.254.184.54:8443/api/website-customers?page=1&limit=20&search=john&status=active"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "google_id": null,
      "is_active": true,
      "created_at": "2026-02-01T10:00:00.000Z",
      "updated_at": "2026-02-09T15:30:00.000Z",
      "last_login": "2026-02-09T14:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 2. Get Customer Statistics

**Endpoint:** `GET /api/website-customers/stats`

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://54.254.184.54:8443/api/website-customers/stats"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_customers": 150,
    "active_customers": 142,
    "suspended_customers": 8,
    "google_signups": 45,
    "today_signups": 3,
    "week_signups": 12,
    "month_signups": 28
  }
}
```

---

### 3. Get Customer by ID

**Endpoint:** `GET /api/website-customers/:id`

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://54.254.184.54:8443/api/website-customers/1"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "google_id": null,
    "is_active": true,
    "created_at": "2026-02-01T10:00:00.000Z",
    "updated_at": "2026-02-09T15:30:00.000Z",
    "last_login": "2026-02-09T14:20:00.000Z"
  }
}
```

---

### 4. Suspend/Activate Customer

**Endpoint:** `PATCH /api/website-customers/:id/status`

**Request Body:**
```json
{
  "is_active": false
}
```

**Example Request:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}' \
  "https://54.254.184.54:8443/api/website-customers/1/status"
```

**Response:**
```json
{
  "success": true,
  "message": "Customer suspended successfully",
  "data": {
    "id": 1,
    "is_active": false
  }
}
```

---

### 5. Get Recent Logins

**Endpoint:** `GET /api/website-customers/recent-logins`

**Query Parameters:**
- `limit` (optional): Number of records (default: 10)

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://54.254.184.54:8443/api/website-customers/recent-logins?limit=5"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "last_login": "2026-02-09T14:20:00.000Z",
      "is_active": true
    }
  ]
}
```

---

### 6. Delete Customer (Soft Delete)

**Endpoint:** `DELETE /api/website-customers/:id`

**Example Request:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "https://54.254.184.54:8443/api/website-customers/1"
```

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

## Frontend Page

### Access URL
```
https://inventoryfullstack-one.vercel.app/website-customers
```

### Features
- ✅ View all website customers with pagination
- ✅ Search by name, email, or phone
- ✅ Filter by status (Active/Suspended)
- ✅ View customer statistics dashboard
- ✅ Suspend/Activate customer accounts
- ✅ Real-time status updates
- ✅ Responsive design

### Statistics Dashboard
- Total Customers
- Active Customers
- Suspended Customers
- Monthly Signups

---

## Deployment

### 1. Create Database Table

Run on your MySQL server:
```bash
mysql -u root -p inventory_db < website-customers-schema.sql
```

Or manually:
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

### 2. Deploy Backend

```bash
cd /home/ubuntu/hunyhunydump/inventoryfullstack

# Pull latest changes
git pull origin stocksphere-phase-1-complete

# Restart server
pm2 restart all
```

### 3. Deploy Frontend

Frontend will auto-deploy via Vercel when you push to GitHub.

Or manually trigger:
```bash
# Push to GitHub
git add .
git commit -m "Add Website Customers Management"
git push origin stocksphere-phase-1-complete
```

### 4. Verify Deployment

**Backend:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://54.254.184.54:8443/api/website-customers/stats
```

**Frontend:**
Visit: https://inventoryfullstack-one.vercel.app/website-customers

---

## Files Created

### Backend
1. `controllers/websiteCustomersController.js` - API logic
2. `routes/websiteCustomersRoutes.js` - Route definitions
3. `website-customers-schema.sql` - Database schema

### Frontend
1. `src/app/website-customers/page.jsx` - Management page

### Documentation
1. `WEBSITE_CUSTOMERS_API_DOCUMENTATION.md` - This file

---

## Testing

### Test Customer Statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://54.254.184.54:8443/api/website-customers/stats
```

### Test Get All Customers
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://54.254.184.54:8443/api/website-customers?page=1&limit=10"
```

### Test Suspend Customer
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}' \
  https://54.254.184.54:8443/api/website-customers/1/status
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

---

## Security Notes

1. All endpoints require JWT authentication
2. Passwords are hashed (never returned in API responses)
3. Soft delete used (is_active flag) instead of hard delete
4. Email and phone are unique constraints
5. Indexes on email and phone for fast lookups

---

## Support

For issues or questions:
- Check server logs: `pm2 logs dashboard-api-1`
- Check browser console for frontend errors
- Verify JWT token is valid
- Ensure database table exists

---

**Last Updated:** February 9, 2026
**Version:** 1.0.0
