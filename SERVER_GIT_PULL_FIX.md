# Server Git Pull Fix Commands

## Issue
Git pull is failing due to untracked file `.env.production.backup` that would be overwritten.

## Solution
Run these commands on your server:

```bash
# Option 1: Remove the conflicting file (recommended)
rm .env.production.backup

# Then pull the changes
git pull origin main

# Option 2: If you want to keep the backup file, move it first
mv .env.production.backup .env.production.backup.old
git pull origin main

# Option 3: Force pull (use with caution)
git reset --hard HEAD
git pull origin main
```

## After Successful Pull
1. Restart your server:
```bash
pm2 restart all
# OR
npm start
```

2. Test the password update functionality:
```bash
curl -k -X PUT https://54.169.31.95:8443/api/users/27 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"test-user","email":"test@example.com","password":"newpassword123","role_id":5}'
```

## What's Being Updated
- ✅ Password update functionality fixed
- ✅ API base URL updated to 54.169.31.95:8443
- ✅ SSL certificate guide added
- ✅ Security improvements and audit logging