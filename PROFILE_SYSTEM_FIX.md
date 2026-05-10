# Profile System Fix Documentation

## Issues Identified

### 1. **Wrong User Name Displayed**
- **Problem**: Profile page shows hardcoded "Alexander Thompson" instead of logged-in user's name
- **Root Cause**: Frontend placeholder text was showing when API data wasn't loading properly
- **Location**: `src/app/profile/page.jsx` line 485

### 2. **Profile Image Upload Fails**
- **Problem**: Uploaded images disappear on page reload
- **Root Cause**: 
  - Missing `user_profiles` table in database
  - `/api/users/profile` endpoint expects `user_profiles` table
  - Image upload functionality requires proper database structure
- **Location**: Backend uses `user_profiles` table but it doesn't exist

### 3. **API Response Format Mismatch**
- **Problem**: Frontend expects `{ success: true, data: {...} }` but backend returns `{ success: true, user: {...} }`
- **Root Cause**: Two different profile endpoints with different response formats:
  - `/api/users/profile` returns `{ success: true, user: {...} }`
  - `/api/profile` returns `{ success: true, data: {...} }`
- **Location**: 
  - `routes/usersRoutes.js` line 207
  - `controllers/profileController.js` line 56

## Database Structure

### Current Structure (Incorrect)
```
users table:
- id
- name
- email
- password
- role_id
- is_active
- created_at
- updated_at
```

### Required Structure (Correct)
```
users table:
- id
- name
- email
- password
- role_id
- is_active
- created_at
- updated_at

user_profiles table: (MISSING - NEEDS TO BE CREATED)
- id
- user_id (FK to users.id)
- profile_image
- phone
- address
- created_at
- updated_at
```

## Solution

### Step 1: Diagnose the Issue
Run the diagnostic script to check database structure:
```powershell
.\deploy-and-diagnose.ps1
```

This will:
- Connect to server via SSH
- Check users table structure
- Check if user_profiles table exists
- Show sample user data
- Verify profile routes are registered

### Step 2: Fix the Database
Run the fix script to create missing table:
```powershell
.\fix-profile-on-server.ps1
```

This will:
- Create `user_profiles` table with proper structure
- Add profile entries for all existing users
- Create uploads directory for profile images
- Restart the server

### Step 3: Verify the Fix
1. Login to https://insora.in
2. Navigate to Profile page
3. Verify your actual name is displayed (not "Alexander Thompson")
4. Upload a profile image
5. Reload the page - image should persist
6. Update phone and address fields
7. Save and verify changes persist

## Technical Details

### API Endpoints

#### GET /api/users/profile
- **Authentication**: Required (JWT token)
- **Response Format**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role_name": "admin",
    "role_display_name": "Administrator",
    "profile_image": "/uploads/1234567890-profile.jpg",
    "phone": "+91 9876543210",
    "address": "123 Main St, City, State"
  }
}
```

#### PUT /api/users/profile
- **Authentication**: Required (JWT token)
- **Content-Type**: multipart/form-data
- **Body**:
  - name (required)
  - email (required)
  - phone (optional)
  - address (optional)
  - profile_image (optional, file upload)
- **Response Format**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

#### GET /api/profile (Legacy - Not Used)
- **Authentication**: Required (JWT token)
- **Response Format**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://ui-avatars.com/api/?name=John+Doe",
    "created_at": "2024-01-01T00:00:00.000Z",
    "role_name": "admin"
  }
}
```

### Frontend Implementation

The frontend (`src/app/profile/page.jsx`) tries to fetch profile data in this order:
1. First tries `/api/users/profile` (preferred)
2. Falls back to `/api/profile` if 404 error
3. Normalizes the response using `normalizeUser()` function

### File Upload Flow

1. User selects image file
2. Frontend creates preview using `URL.createObjectURL()`
3. On save, sends FormData with `profile_image` field
4. Backend saves file to `uploads/` directory
5. Backend stores file path in `user_profiles.profile_image`
6. Backend returns updated user data with image path
7. Frontend displays image from server path

## Files Modified/Created

### Created Files
- `deploy-and-diagnose.ps1` - Diagnostic script
- `fix-profile-database.sql` - SQL fix script
- `fix-profile-on-server.ps1` - Automated fix deployment
- `PROFILE_SYSTEM_FIX.md` - This documentation

### Existing Files (No Changes Needed)
- `routes/usersRoutes.js` - Already has correct profile endpoints
- `controllers/profileController.js` - Legacy endpoint (not used)
- `src/app/profile/page.jsx` - Frontend already handles both endpoints

## Testing Checklist

- [ ] Run diagnostic script to verify issue
- [ ] Run fix script to create user_profiles table
- [ ] Login as admin user
- [ ] Verify correct name displays on profile page
- [ ] Upload profile image
- [ ] Reload page - verify image persists
- [ ] Update phone number
- [ ] Update address
- [ ] Save changes
- [ ] Reload page - verify all changes persist
- [ ] Login as different user
- [ ] Verify their profile shows their data (not admin's data)

## Troubleshooting

### Issue: "user_profiles table doesn't exist"
**Solution**: Run `fix-profile-on-server.ps1`

### Issue: "Cannot upload image"
**Solution**: 
1. Check uploads directory exists: `ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152 "ls -la ~/veru-inventory/uploads"`
2. Check permissions: `ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152 "chmod 755 ~/veru-inventory/uploads"`

### Issue: "Profile shows wrong user data"
**Solution**: 
1. Check JWT token is valid
2. Verify `req.user.id` is correct in backend
3. Check database query uses correct user_id

### Issue: "Image disappears on reload"
**Solution**:
1. Verify image was saved to database: `sudo mysql -e "USE inventory_db; SELECT user_id, profile_image FROM user_profiles;"`
2. Check file exists on server: `ls -la ~/veru-inventory/uploads/`
3. Verify nginx serves static files from uploads directory

## SSH Commands Reference

### Connect to Server
```bash
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152
```

### Check Database
```bash
sudo mysql
USE inventory_db;
DESCRIBE users;
DESCRIBE user_profiles;
SELECT * FROM user_profiles;
```

### Check Server Logs
```bash
cd ~/veru-inventory
pm2 logs
```

### Restart Server
```bash
cd ~/veru-inventory
pm2 restart all
```

### Check Uploads Directory
```bash
ls -la ~/veru-inventory/uploads/
```

## Summary

The profile system issue was caused by a missing `user_profiles` table in the database. The backend code (`routes/usersRoutes.js`) was already correctly implemented to use this table, but the table didn't exist in the production database. 

The fix creates the `user_profiles` table with proper structure and foreign key relationships, then populates it with entries for all existing users. This allows:
- Profile images to be uploaded and persisted
- Phone and address fields to be stored
- Correct user data to be displayed for each logged-in user

No code changes were needed - only database structure fixes.
