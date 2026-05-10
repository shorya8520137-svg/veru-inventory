# Profile Issue Analysis - Complete Database Review

## Database Structure (CONFIRMED via SSH download)

### 1. users table (Inventory System Users)
```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,  ← EXISTS!
  `role_id` int(11) NOT NULL DEFAULT 6,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  ...
)
```

### 2. user_profiles table (Extended Profile Data)
```sql
CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,  ← For uploaded images
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
)
```

### 3. website_customers table (Website Users - DO NOT TOUCH)
```sql
CREATE TABLE `website_customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  ...
)
```

## Current Backend Implementation

### Route: GET /api/users/profile
**File**: `routes/usersRoutes.js` line 207
**Response Format**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role_name": "admin",
    "profile_image": "/uploads/123456-profile.jpg",
    "phone": "+91 9876543210",
    "address": "123 Main St"
  }
}
```

### Route: GET /api/profile
**File**: `controllers/profileController.js` line 56
**Response Format**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "avatar": "https://ui-avatars.com/api/?name=Admin+User",
    "role_name": "admin"
  }
}
```

## Frontend Implementation

**File**: `src/app/profile/page.jsx`

### Current Flow:
1. Tries `/api/users/profile` first
2. Falls back to `/api/profile` on 404
3. Normalizes response using `normalizeUser()` function
4. Expects `profile_image` or `avatar` field

### Issue Identified:
The frontend `normalizeUser()` function (line 127) does:
```javascript
function normalizeUser(data) {
    const user = data.user || data.data || {};
    return {
        ...user,
        profile_image: user.profile_image || user.avatar || ''
    };
}
```

This correctly handles both response formats!

## Root Cause Analysis

The database structure is **CORRECT**. The backend code is **CORRECT**. The frontend code is **CORRECT**.

### The Real Issues:

1. **Missing user_profiles entries**: Some users may not have entries in `user_profiles` table
2. **Image upload path**: Uploaded images need to be served by nginx from `/uploads/` directory
3. **Hardcoded placeholder**: Frontend shows "Alexander Thompson" as placeholder text when data is loading

## Solution

### Fix 1: Ensure all users have user_profiles entries
```sql
INSERT INTO user_profiles (user_id, profile_image, phone, address)
SELECT u.id, NULL, NULL, NULL
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.id IS NULL;
```

### Fix 2: Verify nginx serves uploads directory
```nginx
location /uploads/ {
    alias /home/ubuntu/veru-inventory/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Fix 3: Check uploads directory permissions
```bash
mkdir -p ~/veru-inventory/uploads
chmod 755 ~/veru-inventory/uploads
chown ubuntu:ubuntu ~/veru-inventory/uploads
```

## Testing Steps

1. **Check if user has profile entry**:
```sql
SELECT u.id, u.name, u.email, up.profile_image, up.phone, up.address
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'your-email@example.com';
```

2. **Test API endpoint**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://insora.in/api/users/profile
```

3. **Check uploads directory**:
```bash
ls -la ~/veru-inventory/uploads/
```

4. **Test image upload**:
- Login to https://insora.in
- Go to Profile page
- Upload an image
- Check if file appears in uploads directory
- Reload page - image should persist

## No Code Changes Needed!

The system is already correctly implemented. We just need to:
1. Ensure all users have user_profiles entries
2. Verify uploads directory exists and has correct permissions
3. Confirm nginx serves /uploads/ path

## Files to Review (No Changes Needed)
- ✓ `routes/usersRoutes.js` - Correctly uses user_profiles table
- ✓ `controllers/profileController.js` - Legacy endpoint (not used)
- ✓ `src/app/profile/page.jsx` - Correctly handles both response formats
- ✓ Database schema - user_profiles table exists with proper structure
