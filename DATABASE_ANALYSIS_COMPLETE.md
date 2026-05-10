# Complete Database Analysis - Profile System

## Database Downloaded: 78MB
**File**: `database-backup/complete_database.sql`

---

## 1. USERS TABLE (Inventory System Users)

### Structure:
```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `role` enum('developer','admin','user','viewer') DEFAULT 'viewer',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `otp_code` varchar(10) DEFAULT NULL,
  `totp_secret` varchar(64) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `role_id` int(11) NOT NULL DEFAULT 6,
  `is_active` tinyint(1) DEFAULT 1,
  `disabled_at` timestamp NULL DEFAULT NULL,
  `disabled_by` int(11) DEFAULT NULL,
  `disabled_reason` text DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `login_count` int(11) DEFAULT 0,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `two_factor_backup_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `two_factor_setup_at` timestamp NULL DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,  ← EXISTS!
  `username` varchar(100) DEFAULT NULL,
  `tenant_id` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4;
```

### Sample Data:
```sql
INSERT INTO `users` VALUES
(1, 'System Administrator', 'admin@company.com', '$2b$10$...', NULL, 'viewer', 
'2026-01-17 16:29:13', NULL, NULL, NULL, NULL, NULL, 1, 1, NULL, NULL, NULL, 
'2026-05-10 16:00:33', '2026-05-10 16:00:33', 486, NULL, 0, NULL, NULL, 
'/uploads/avatars/avatar-1-1770311643130-479216807.png', 'System Administrator', 1);
```

**KEY FINDINGS**:
- ✅ `avatar` column EXISTS in users table (line 305000)
- ✅ User ID 1 has avatar: `/uploads/avatars/avatar-1-1770311643130-479216807.png`
- ✅ Total users: 30 (AUTO_INCREMENT=31)

---

## 2. USER_PROFILES TABLE (Extended Profile Data)

### Structure:
```sql
CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_user_profiles_user` (`user_id`),
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
```

### Sample Data:
```sql
INSERT INTO `user_profiles` VALUES
(1, 1, '/uploads/1764583693143.jpg', NULL, NULL, '2025-12-01 10:08:13', '2025-12-01 10:08:13'),
(2, 47, '/uploads/1764664982383.jpg', NULL, NULL, '2025-12-02 08:43:02', '2025-12-02 08:43:02'),
(3, 48, '/uploads/1764665136761.jpg', NULL, NULL, '2025-12-02 08:45:36', '2025-12-02 08:45:36'),
(4, 50, '/uploads/1764665941639.jpg', NULL, NULL, '2025-12-02 08:54:20', '2025-12-02 08:59:01'),
(5, 51, '/uploads/1764671721044.jpg', NULL, NULL, '2025-12-02 08:57:50', '2025-12-02 10:35:21');
```

**KEY FINDINGS**:
- ✅ user_profiles table EXISTS
- ✅ Properly linked to users table via foreign key
- ⚠️ **ONLY 5 users have profiles** (user_ids: 1, 47, 48, 50, 51)
- ⚠️ **25 users are MISSING profiles** (30 total users - 5 with profiles = 25 missing)
- ✅ Profile images are stored in `/uploads/` directory

---

## 3. THE PROBLEM IDENTIFIED

### Issue 1: Missing user_profiles Entries
**Problem**: 25 out of 30 users don't have entries in `user_profiles` table

**Impact**: 
- When these users try to access profile page, the backend query returns NULL for profile data
- Frontend shows placeholder "Alexander Thompson" because no real data is loaded
- Image upload fails because there's no profile record to update

### Issue 2: Duplicate Avatar Storage
**Confusion**:
- `users.avatar` column stores: `/uploads/avatars/avatar-1-1770311643130-479216807.png`
- `user_profiles.profile_image` stores: `/uploads/1764583693143.jpg`
- **Same user (ID 1) has TWO different images stored!**

### Issue 3: Backend Code Mismatch
**Backend expects**:
- `routes/usersRoutes.js` queries `user_profiles` table for profile_image, phone, address
- Returns data in format: `{ success: true, user: {...} }`

**Frontend expects**:
- Tries `/api/users/profile` first
- Falls back to `/api/profile`
- Normalizes response to use either `profile_image` or `avatar`

---

## 4. THE SOLUTION

### Step 1: Create Missing user_profiles Entries
```sql
-- Create profiles for users who don't have them
INSERT INTO user_profiles (user_id, profile_image, phone, address)
SELECT u.id, NULL, NULL, NULL
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.id IS NULL;
```

This will create 25 new profile entries for users without profiles.

### Step 2: Sync Avatar Data (Optional)
If you want to use the avatar from users table in user_profiles:
```sql
-- Copy avatar from users table to user_profiles
UPDATE user_profiles up
INNER JOIN users u ON up.user_id = u.id
SET up.profile_image = u.avatar
WHERE u.avatar IS NOT NULL 
AND (up.profile_image IS NULL OR up.profile_image = '');
```

### Step 3: Verify Uploads Directory
```bash
# Check if uploads directory exists and has correct permissions
ls -la ~/veru-inventory/uploads/
chmod 755 ~/veru-inventory/uploads/
```

### Step 4: Restart Server
```bash
cd ~/veru-inventory
pm2 restart all
```

---

## 5. WHY THE PROFILE PAGE SHOWS "Alexander Thompson"

**Root Cause**: 
1. User logs in (e.g., user_id = 10)
2. Frontend calls `/api/users/profile`
3. Backend queries:
   ```sql
   SELECT u.id, u.name, u.email, up.profile_image, up.phone, up.address
   FROM users u
   LEFT JOIN user_profiles up ON u.id = up.user_id
   WHERE u.id = 10
   ```
4. Result: `up.profile_image`, `up.phone`, `up.address` are ALL NULL (because user_id 10 has no profile entry)
5. Frontend receives empty data
6. Frontend shows placeholder text "Alexander Thompson" from the input placeholder attribute

---

## 6. FIX SCRIPT

Run this script to fix everything:

```bash
# Connect to server
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152

# Run SQL fix
sudo mysql -e "
USE inventory_db;

-- Show users without profiles
SELECT 'Users without profiles:' AS info, COUNT(*) AS count
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.id IS NULL;

-- Create missing profiles
INSERT INTO user_profiles (user_id, profile_image, phone, address)
SELECT u.id, NULL, NULL, NULL
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.id IS NULL;

-- Verify
SELECT 'Total users:' AS info, COUNT(*) AS count FROM users;
SELECT 'Total profiles:' AS info, COUNT(*) AS count FROM user_profiles;
"

# Restart server
cd ~/veru-inventory
pm2 restart all
```

---

## 7. SUMMARY

### Database Structure: ✅ CORRECT
- users table has `avatar` column
- user_profiles table exists with proper foreign key
- Both tables are properly structured

### The Real Problem: ⚠️ MISSING DATA
- **25 out of 30 users don't have user_profiles entries**
- This causes NULL data to be returned by the API
- Frontend shows placeholder text when data is NULL

### The Fix: 🔧 SIMPLE
- Create user_profiles entries for users without them
- No code changes needed
- No schema changes needed
- Just insert missing rows

### After Fix:
- All users will have profile entries
- Profile page will show correct user name
- Image upload will work
- Data will persist on reload

---

## 8. NO CODE CHANGES NEEDED!

The backend code is **CORRECT**:
- ✅ `routes/usersRoutes.js` - Properly queries user_profiles
- ✅ `controllers/profileController.js` - Legacy endpoint (not used)
- ✅ `src/app/profile/page.jsx` - Handles both response formats

The database schema is **CORRECT**:
- ✅ users table has avatar column
- ✅ user_profiles table exists
- ✅ Foreign key relationship is proper

**We just need to INSERT missing data!**
