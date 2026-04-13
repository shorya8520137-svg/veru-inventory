# Ticket Management Permissions Fix

## 🎯 **Issue**
The "Ticket Management" tab is not visible to admin users because the `TICKETS_MANAGE` permission is missing from the database.

## 🔧 **Solution**
Run the provided script to create the missing permissions and assign them to the super_admin role.

## 📋 **Instructions**

### **Step 1: Pull Latest Code**
```bash
git pull origin main
```

### **Step 2: Make Script Executable**
```bash
chmod +x fix-ticket-permissions-server.sh
```

### **Step 3: Run the Fix**
```bash
./fix-ticket-permissions-server.sh
```

### **Step 4: Restart Server**
```bash
# If using PM2:
pm2 restart all

# If running directly:
pkill -f node && npm start
```

### **Step 5: Test**
1. Clear browser cache and localStorage
2. Login as super_admin user
3. Check if "Ticket Management" tab appears in sidebar

## ✅ **Expected Results**

After running the script:
- ✅ 4 new ticket permissions created (TICKETS_MANAGE, TICKETS_VIEW, TICKETS_CREATE, TICKETS_EDIT)
- ✅ All permissions assigned to super_admin role
- ✅ "Ticket Management" tab visible to super_admin users
- ✅ Tab links to `/tickets` page
- ✅ "Raise Ticket" tab remains available for all users

## 🔍 **Verification**

The script will show:
1. Created permissions list
2. Role assignments
3. Super admin users who will get access

## 🚨 **Troubleshooting**

If the script fails:
1. Check MySQL is running: `systemctl status mysql`
2. Verify database credentials in script
3. Ensure `inventory_db` database exists
4. Check MySQL logs: `tail -f /var/log/mysql/error.log`

## 📞 **Support**

If you encounter issues:
1. Check the script output for specific error messages
2. Verify your database connection
3. Ensure you have proper MySQL permissions